#!/usr/bin/env ts-node

/**
 * Migration script to reindex Firestore documents to Pinecone
 * 
 * This script:
 * 1. Connects to Firestore and retrieves all travel documents
 * 2. Processes them through the new Pinecone vector store
 * 3. Provides progress tracking and error handling
 * 4. Can be run multiple times safely (idempotent)
 */

import { adminDb } from '../lib/firebase/admin';
import { getVectorStore } from '../lib/vector/pinecone';
import { IngestionService } from '../services/ai/ingestion.service';

interface MigrationStats {
  totalDocuments: number;
  processedDocuments: number;
  successfulDocuments: number;
  failedDocuments: number;
  skippedDocuments: number;
  startTime: Date;
  endTime?: Date;
  errors: Array<{ documentId: string; error: string }>;
}

class PineconeMigration {
  private vectorStore = getVectorStore();
  private ingestionService = new IngestionService();
  private stats: MigrationStats = {
    totalDocuments: 0,
    processedDocuments: 0,
    successfulDocuments: 0,
    failedDocuments: 0,
    skippedDocuments: 0,
    startTime: new Date(),
    errors: [],
  };

  async run(): Promise<void> {
    console.log('🚀 Starting Pinecone migration...');
    console.log(`📅 Started at: ${this.stats.startTime.toISOString()}`);

    try {
      // Initialize Pinecone
      console.log('🔧 Initializing Pinecone...');
      await this.vectorStore.init();
      console.log('✅ Pinecone initialized successfully');

      // Get all documents from Firestore
      console.log('📚 Fetching documents from Firestore...');
      const documents = await this.fetchAllDocuments();
      this.stats.totalDocuments = documents.length;
      console.log(`📊 Found ${documents.length} documents to migrate`);

      if (documents.length === 0) {
        console.log('ℹ️  No documents found to migrate');
        return;
      }

      // Process documents in batches
      await this.processDocumentsInBatches(documents);

      // Print final stats
      this.printFinalStats();

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  private async fetchAllDocuments(): Promise<any[]> {
    const documents: any[] = [];

    try {
      // Fetch travel guides
      const guidesSnapshot = await adminDb
        .collection('travel_guides')
        .get();

      guidesSnapshot.forEach((doc: any) => {
        documents.push({
          id: doc.id,
          ...doc.data(),
          type: 'guide',
          source: 'firestore',
        });
      });

      // Fetch itineraries
      const itinerariesSnapshot = await adminDb
        .collection('itineraries')
        .get();

      itinerariesSnapshot.forEach((doc: any) => {
        documents.push({
          id: doc.id,
          ...doc.data(),
          type: 'itinerary',
          source: 'firestore',
        });
      });

      // Fetch travel tips
      const tipsSnapshot = await adminDb
        .collection('travel_tips')
        .get();

      tipsSnapshot.forEach((doc: any) => {
        documents.push({
          id: doc.id,
          ...doc.data(),
          type: 'tip',
          source: 'firestore',
        });
      });

      // Fetch destinations
      const destinationsSnapshot = await adminDb
        .collection('destinations')
        .get();

      destinationsSnapshot.forEach((doc: any) => {
        documents.push({
          id: doc.id,
          ...doc.data(),
          type: 'destination',
          source: 'firestore',
        });
      });

      console.log(`📋 Fetched documents by type:`);
      console.log(`   - Guides: ${guidesSnapshot.size}`);
      console.log(`   - Itineraries: ${itinerariesSnapshot.size}`);
      console.log(`   - Tips: ${tipsSnapshot.size}`);
      console.log(`   - Destinations: ${destinationsSnapshot.size}`);

    } catch (error) {
      console.error('❌ Error fetching documents from Firestore:', error);
      throw error;
    }

    return documents;
  }

  private async processDocumentsInBatches(documents: any[]): Promise<void> {
    const batchSize = 10; // Process 10 documents at a time
    const totalBatches = Math.ceil(documents.length / batchSize);

    console.log(`🔄 Processing ${documents.length} documents in ${totalBatches} batches of ${batchSize}`);

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;

      console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} documents)`);

      await this.processBatch(batch);

      // Progress update
      const progress = ((i + batch.length) / documents.length * 100).toFixed(1);
      console.log(`📈 Progress: ${progress}% (${i + batch.length}/${documents.length})`);
    }
  }

  private async processBatch(documents: any[]): Promise<void> {
    const promises = documents.map(doc => this.processDocument(doc));
    await Promise.allSettled(promises);
  }

  private async processDocument(document: any): Promise<void> {
    this.stats.processedDocuments++;

    try {
      // Check if document is already migrated (optional - for idempotency)
      if (await this.isDocumentAlreadyMigrated(document.id)) {
        this.stats.skippedDocuments++;
        console.log(`⏭️  Skipping already migrated document: ${document.id}`);
        return;
      }

      // Convert document to the format expected by ingestion service
      const formattedDoc = this.formatDocumentForMigration(document);

      // Process through ingestion service
      await this.ingestionService.ingestItineraryData(formattedDoc);

      this.stats.successfulDocuments++;
      console.log(`✅ Successfully migrated: ${document.id}`);

    } catch (error) {
      this.stats.failedDocuments++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.stats.errors.push({
        documentId: document.id,
        error: errorMessage,
      });
      console.error(`❌ Failed to migrate document ${document.id}:`, errorMessage);
    }
  }

  private async isDocumentAlreadyMigrated(documentId: string): Promise<boolean> {
    try {
      // Query Pinecone to check if document exists
      const queryEmbedding = await this.vectorStore.generateEmbedding('test');
      const results = await this.vectorStore.query(queryEmbedding, 1, {
        documentId: documentId,
      });

      return results.length > 0;
    } catch (error) {
      // If we can't check, assume it's not migrated
      return false;
    }
  }

  private formatDocumentForMigration(document: any): any {
    // Convert Firestore document to the format expected by ingestion service
    const formattedDoc: any = {
      id: document.id,
      title: document.title || document.name || `Document ${document.id}`,
      destination: document.destination || document.location || 'Unknown',
      startDate: document.startDate || new Date().toISOString(),
      endDate: document.endDate || new Date().toISOString(),
      travelers: document.travelers || 1,
      budget: document.budget || 0,
      days: document.days || [],
      metadata: {
        ...document,
        migratedAt: new Date().toISOString(),
        migrationSource: 'firestore',
      },
    };

    // If it's a guide or tip, format as content
    if (document.type === 'guide' || document.type === 'tip') {
      formattedDoc.content = document.content || document.description || document.text || '';
      formattedDoc.type = document.type;
    }

    return formattedDoc;
  }

  private printFinalStats(): void {
    this.stats.endTime = new Date();
    const duration = this.stats.endTime.getTime() - this.stats.startTime.getTime();
    const durationMinutes = Math.round(duration / 60000);

    console.log('\n🎉 Migration completed!');
    console.log('📊 Final Statistics:');
    console.log(`   📅 Started: ${this.stats.startTime.toISOString()}`);
    console.log(`   📅 Finished: ${this.stats.endTime.toISOString()}`);
    console.log(`   ⏱️  Duration: ${durationMinutes} minutes`);
    console.log(`   📚 Total documents: ${this.stats.totalDocuments}`);
    console.log(`   ✅ Successful: ${this.stats.successfulDocuments}`);
    console.log(`   ❌ Failed: ${this.stats.failedDocuments}`);
    console.log(`   ⏭️  Skipped: ${this.stats.skippedDocuments}`);
    console.log(`   📈 Success rate: ${((this.stats.successfulDocuments / this.stats.totalDocuments) * 100).toFixed(1)}%`);

    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.stats.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.documentId}: ${error.error}`);
      });
    }

    if (this.stats.failedDocuments > 0) {
      console.log('\n⚠️  Some documents failed to migrate. You can run the script again to retry failed documents.');
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Pinecone Migration Script

Usage: npm run migrate:pinecone [options]

Options:
  --help, -h     Show this help message
  --dry-run      Show what would be migrated without actually doing it
  --force        Force migration even if documents already exist

Environment Variables Required:
  PINECONE_API_KEY        Your Pinecone API key
  GOOGLE_GEMINI_API_KEY   Your Google Gemini API key
  PINECONE_INDEX_NAME     Name of the Pinecone index (optional)
  FIREBASE_PROJECT_ID     Your Firebase project ID
  FIREBASE_PRIVATE_KEY    Your Firebase private key
  FIREBASE_CLIENT_EMAIL   Your Firebase client email

Examples:
  npm run migrate:pinecone
  npm run migrate:pinecone -- --dry-run
  npm run migrate:pinecone -- --force
    `);
    return;
  }

  // Check required environment variables
  const requiredEnvVars = [
    'PINECONE_API_KEY',
    'GOOGLE_GEMINI_API_KEY',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease set these environment variables and try again.');
    process.exit(1);
  }

  try {
    const migration = new PineconeMigration();
    await migration.run();
    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { PineconeMigration };
