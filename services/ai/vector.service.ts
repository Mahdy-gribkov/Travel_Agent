import { getVectorStore, QueryResult } from '@/lib/vector/pinecone';

export interface Document {
  id: string;
  content: string;
  metadata: {
    [key: string]: any;
  };
}

export interface SearchResult {
  id: string;
  content: string;
  metadata: Document['metadata'];
  score?: number;
}

export class VectorService {
  private vectorStore = getVectorStore();
  private isInitialized: boolean = false;

  constructor() {
    // Initialize Pinecone on construction
    this.vectorStore.init().catch(console.error);
  }

  async initializeIndex(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.vectorStore.init();
      this.isInitialized = true;
      console.log('Vector service initialized with Pinecone');
    } catch (error) {
      console.error('Failed to initialize vector service:', error);
      throw error;
    }
  }

  async embedDocument(text: string): Promise<number[]> {
    try {
      return await this.vectorStore.generateEmbedding(text);
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw error;
    }
  }

  async upsertDocuments(documents: Document[]): Promise<void> {
    try {
      for (const doc of documents) {
        // Process the document content into chunks and generate embeddings
        const vectors = await this.vectorStore.processText(
          doc.content,
          {
            ...doc.metadata,
            documentId: doc.id,
            originalContent: doc.content,
          }
        );
        
        if (vectors.length > 0) {
          await this.vectorStore.upsertVectors(vectors);
        }
      }
      
      console.log(`Successfully upserted ${documents.length} documents`);
    } catch (error) {
      console.error('Failed to upsert documents:', error);
      throw error;
    }
  }

  async queryDocuments(query: string, topK: number = 5): Promise<SearchResult[]> {
    try {
      await this.initializeIndex();
      
      // Generate embedding for the query
      const queryEmbedding = await this.embedDocument(query);
      
      // Query Pinecone
      const results = await this.vectorStore.query(queryEmbedding, topK);
      
      return results.map(result => ({
        id: result.id,
        content: result.metadata?.text || result.metadata?.originalContent || '',
        metadata: result.metadata || {},
        score: result.score
      }));
    } catch (error) {
      console.error('Failed to query documents:', error);
      return [];
    }
  }

  async searchByType(type: string, query: string, options: { topK?: number } = {}): Promise<SearchResult[]> {
    try {
      await this.initializeIndex();
      
      const queryEmbedding = await this.embedDocument(query);
      const topK = options.topK || 5;
      
      // Query with type filter
      const results = await this.vectorStore.query(queryEmbedding, topK, { type });
      
      return results.map(result => ({
        id: result.id,
        content: result.metadata?.text || result.metadata?.originalContent || '',
        metadata: result.metadata || {},
        score: result.score
      }));
    } catch (error) {
      console.error('Failed to search by type:', error);
      return [];
    }
  }

  async searchByLocation(location: string, options: { topK?: number } = {}): Promise<SearchResult[]> {
    try {
      await this.initializeIndex();
      
      const queryEmbedding = await this.embedDocument(location);
      const topK = options.topK || 5;
      
      // Query with location filter (case-insensitive)
      const results = await this.vectorStore.query(queryEmbedding, topK, {
        location: { $regex: location, $options: 'i' }
      });
      
      return results.map(result => ({
        id: result.id,
        content: result.metadata?.text || result.metadata?.originalContent || '',
        metadata: result.metadata || {},
        score: result.score
      }));
    } catch (error) {
      console.error('Failed to search by location:', error);
      return [];
    }
  }

  async searchSimilar(query: string, options: { topK?: number; filter?: any } = {}): Promise<SearchResult[]> {
    try {
      await this.initializeIndex();
      
      const queryEmbedding = await this.embedDocument(query);
      const topK = options.topK || 5;
      
      // Query with optional filter
      const results = await this.vectorStore.query(queryEmbedding, topK, options.filter);
      
      return results.map(result => ({
        id: result.id,
        content: result.metadata?.text || result.metadata?.originalContent || '',
        metadata: result.metadata || {},
        score: result.score
      }));
    } catch (error) {
      console.error('Failed to search similar:', error);
      return [];
    }
  }

  async getIndexStats(): Promise<any> {
    try {
      return await this.vectorStore.getIndexStats();
    } catch (error) {
      console.error('Failed to get index stats:', error);
      return { error: 'Failed to get stats' };
    }
  }
}