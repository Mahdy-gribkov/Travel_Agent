/**
 * Pinecone vector database wrapper for RAG operations
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface VectorItem {
  id: string;
  values: number[];
  metadata?: Record<string, any>;
}

export interface QueryResult {
  id: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface EmbeddingOptions {
  model?: string;
  chunkSize?: number;
  overlap?: number;
}

export class PineconeVectorStore {
  private client: Pinecone;
  private genAI: GoogleGenerativeAI;
  private indexName: string;

  constructor() {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY environment variable is required');
    }
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      throw new Error('GOOGLE_GEMINI_API_KEY environment variable is required');
    }

    this.client = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    
    // Use environment-specific index name
    const env = process.env.NODE_ENV || 'development';
    this.indexName = process.env.PINECONE_INDEX_NAME || `vaitravel-${env}`;
  }

  /**
   * Initialize the Pinecone index
   */
  async init(): Promise<void> {
    try {
      const indexList = await this.client.listIndexes();
      const indexExists = indexList.indexes?.some(index => index.name === this.indexName);

      if (!indexExists) {
        console.log(`Creating Pinecone index: ${this.indexName}`);
        await this.client.createIndex({
          name: this.indexName,
          dimension: 768, // Gemini embedding dimension
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1',
            },
          },
        });

        // Wait for index to be ready
        await this.waitForIndexReady();
      } else {
        console.log(`Using existing Pinecone index: ${this.indexName}`);
      }
    } catch (error) {
      console.error('Failed to initialize Pinecone index:', error);
      throw error;
    }
  }

  /**
   * Wait for index to be ready
   */
  private async waitForIndexReady(): Promise<void> {
    const maxRetries = 30;
    const retryDelay = 2000; // 2 seconds

    for (let i = 0; i < maxRetries; i++) {
      try {
        const indexDescription = await this.client.describeIndex(this.indexName);
        if (indexDescription.status?.ready) {
          console.log(`Index ${this.indexName} is ready`);
          return;
        }
        console.log(`Waiting for index to be ready... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } catch (error) {
        console.log(`Index not ready yet, retrying... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    throw new Error(`Index ${this.indexName} failed to become ready within ${maxRetries * retryDelay / 1000} seconds`);
  }

  /**
   * Generate embeddings using Gemini
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'embedding-001' });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw error;
    }
  }

  /**
   * Upsert vectors to the index
   */
  async upsertVectors(items: VectorItem[]): Promise<void> {
    try {
      const index = this.client.index(this.indexName);
      
      // Convert to Pinecone format
      const vectors = items.map(item => ({
        id: item.id,
        values: item.values,
        metadata: item.metadata || {},
      }));

      await index.upsert(vectors);
      console.log(`Upserted ${vectors.length} vectors to index ${this.indexName}`);
    } catch (error) {
      console.error('Failed to upsert vectors:', error);
      throw error;
    }
  }

  /**
   * Query vectors from the index
   */
  async query(
    vector: number[],
    topK: number = 10,
    filter?: Record<string, any>
  ): Promise<QueryResult[]> {
    try {
      const index = this.client.index(this.indexName);
      
      const queryResponse = await index.query({
        vector,
        topK,
        includeMetadata: true,
        ...(filter && { filter }),
      });

      return queryResponse.matches?.map(match => ({
        id: match.id,
        score: match.score || 0,
        metadata: match.metadata,
      })) || [];
    } catch (error) {
      console.error('Failed to query vectors:', error);
      throw error;
    }
  }

  /**
   * Delete vectors by IDs
   */
  async deleteVectors(ids: string[]): Promise<void> {
    try {
      const index = this.client.index(this.indexName);
      await index.deleteMany(ids);
      console.log(`Deleted ${ids.length} vectors from index ${this.indexName}`);
    } catch (error) {
      console.error('Failed to delete vectors:', error);
      throw error;
    }
  }

  /**
   * Delete the entire index
   */
  async deleteIndex(): Promise<void> {
    try {
      await this.client.deleteIndex(this.indexName);
      console.log(`Deleted index ${this.indexName}`);
    } catch (error) {
      console.error('Failed to delete index:', error);
      throw error;
    }
  }

  /**
   * Get index statistics
   */
  async getIndexStats(): Promise<any> {
    try {
      const index = this.client.index(this.indexName);
      const stats = await index.describeIndexStats();
      return stats;
    } catch (error) {
      console.error('Failed to get index stats:', error);
      throw error;
    }
  }

  /**
   * Chunk text for embedding
   */
  chunkText(text: string, options: EmbeddingOptions = {}): string[] {
    const chunkSize = options.chunkSize || 500;
    const overlap = options.overlap || 100;
    
    const chunks: string[] = [];
    let start = 0;
    
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      let chunk = text.slice(start, end);
      
      // Try to break at word boundaries
      if (end < text.length) {
        const lastSpace = chunk.lastIndexOf(' ');
        if (lastSpace > chunkSize * 0.8) {
          chunk = chunk.slice(0, lastSpace);
          start += lastSpace + 1;
        } else {
          start += chunkSize - overlap;
        }
      } else {
        start = text.length;
      }
      
      if (chunk.trim().length > 0) {
        chunks.push(chunk.trim());
      }
    }
    
    return chunks;
  }

  /**
   * Process and embed text chunks
   */
  async processText(
    text: string,
    metadata: Record<string, any> = {},
    options: EmbeddingOptions = {}
  ): Promise<VectorItem[]> {
    const chunks = this.chunkText(text, options);
    const vectors: VectorItem[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await this.generateEmbedding(chunk);
      
      vectors.push({
        id: `${metadata.source || 'unknown'}_chunk_${i}`,
        values: embedding,
        metadata: {
          ...metadata,
          chunkIndex: i,
          totalChunks: chunks.length,
          text: chunk,
          createdAt: new Date().toISOString(),
        },
      });
    }
    
    return vectors;
  }
}

// Singleton instance
let vectorStore: PineconeVectorStore | null = null;

export function getVectorStore(): PineconeVectorStore {
  if (!vectorStore) {
    vectorStore = new PineconeVectorStore();
  }
  return vectorStore;
}

// Export types
export type { VectorItem, QueryResult, EmbeddingOptions };
