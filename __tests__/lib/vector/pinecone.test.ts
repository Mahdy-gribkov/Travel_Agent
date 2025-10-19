/**
 * Unit tests for Pinecone vector store wrapper
 */

import { PineconeVectorStore, getVectorStore } from '@/lib/vector/pinecone';

// Mock Pinecone
jest.mock('@pinecone-database/pinecone', () => ({
  Pinecone: jest.fn().mockImplementation(() => ({
    listIndexes: jest.fn(),
    createIndex: jest.fn(),
    describeIndex: jest.fn(),
    index: jest.fn().mockReturnValue({
      upsert: jest.fn(),
      query: jest.fn(),
      deleteMany: jest.fn(),
      describeIndexStats: jest.fn(),
    }),
    deleteIndex: jest.fn(),
  })),
}));

// Mock Google Generative AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      embedContent: jest.fn().mockResolvedValue({
        embedding: {
          values: Array.from({ length: 768 }, () => Math.random()),
        },
      }),
    }),
  })),
}));

describe('PineconeVectorStore', () => {
  let vectorStore: PineconeVectorStore;
  let mockPinecone: any;

  beforeEach(() => {
    // Set up environment variables
    process.env.PINECONE_API_KEY = 'test-pinecone-key';
    process.env.GOOGLE_GEMINI_API_KEY = 'test-gemini-key';
    process.env.PINECONE_INDEX_NAME = 'test-index';

    // Reset mocks
    jest.clearAllMocks();

    // Get the mocked Pinecone instance
    const { Pinecone } = require('@pinecone-database/pinecone');
    mockPinecone = new Pinecone();

    vectorStore = new PineconeVectorStore();
  });

  afterEach(() => {
    delete process.env.PINECONE_API_KEY;
    delete process.env.GOOGLE_GEMINI_API_KEY;
    delete process.env.PINECONE_INDEX_NAME;
  });

  describe('constructor', () => {
    it('should throw error if PINECONE_API_KEY is missing', () => {
      delete process.env.PINECONE_API_KEY;
      expect(() => new PineconeVectorStore()).toThrow('PINECONE_API_KEY environment variable is required');
    });

    it('should throw error if GOOGLE_GEMINI_API_KEY is missing', () => {
      delete process.env.GOOGLE_GEMINI_API_KEY;
      expect(() => new PineconeVectorStore()).toThrow('GOOGLE_GEMINI_API_KEY environment variable is required');
    });

    it('should use default index name if not provided', () => {
      delete process.env.PINECONE_INDEX_NAME;
      process.env.NODE_ENV = 'test';
      const store = new PineconeVectorStore();
      expect(store).toBeDefined();
    });
  });

  describe('init', () => {
    it('should create index if it does not exist', async () => {
      mockPinecone.listIndexes.mockResolvedValue({ indexes: [] });
      mockPinecone.createIndex.mockResolvedValue({});
      mockPinecone.describeIndex.mockResolvedValue({ status: { ready: true } });

      await vectorStore.init();

      expect(mockPinecone.listIndexes).toHaveBeenCalled();
      expect(mockPinecone.createIndex).toHaveBeenCalledWith({
        name: 'test-index',
        dimension: 768,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
          },
        },
      });
    });

    it('should use existing index if it exists', async () => {
      mockPinecone.listIndexes.mockResolvedValue({
        indexes: [{ name: 'test-index' }],
      });

      await vectorStore.init();

      expect(mockPinecone.listIndexes).toHaveBeenCalled();
      expect(mockPinecone.createIndex).not.toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      mockPinecone.listIndexes.mockRejectedValue(new Error('Pinecone error'));

      await expect(vectorStore.init()).rejects.toThrow('Pinecone error');
    });
  });

  describe('generateEmbedding', () => {
    it('should generate embedding for text', async () => {
      const mockEmbedding = Array.from({ length: 768 }, () => Math.random());
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const mockGenAI = new GoogleGenerativeAI();
      const mockModel = mockGenAI.getGenerativeModel();
      mockModel.embedContent.mockResolvedValue({
        embedding: { values: mockEmbedding },
      });

      const result = await vectorStore.generateEmbedding('test text');

      expect(result).toEqual(mockEmbedding);
      expect(mockModel.embedContent).toHaveBeenCalledWith('test text');
    });

    it('should handle embedding generation errors', async () => {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const mockGenAI = new GoogleGenerativeAI();
      const mockModel = mockGenAI.getGenerativeModel();
      mockModel.embedContent.mockRejectedValue(new Error('Embedding error'));

      await expect(vectorStore.generateEmbedding('test text')).rejects.toThrow('Embedding error');
    });
  });

  describe('upsertVectors', () => {
    it('should upsert vectors to the index', async () => {
      const mockIndex = {
        upsert: jest.fn().mockResolvedValue({}),
      };
      mockPinecone.index.mockReturnValue(mockIndex);

      const vectors = [
        {
          id: 'test-1',
          values: [0.1, 0.2, 0.3],
          metadata: { text: 'test content' },
        },
        {
          id: 'test-2',
          values: [0.4, 0.5, 0.6],
          metadata: { text: 'another test' },
        },
      ];

      await vectorStore.upsertVectors(vectors);

      expect(mockPinecone.index).toHaveBeenCalledWith('test-index');
      expect(mockIndex.upsert).toHaveBeenCalledWith(vectors);
    });

    it('should handle upsert errors', async () => {
      const mockIndex = {
        upsert: jest.fn().mockRejectedValue(new Error('Upsert error')),
      };
      mockPinecone.index.mockReturnValue(mockIndex);

      const vectors = [{ id: 'test-1', values: [0.1, 0.2, 0.3] }];

      await expect(vectorStore.upsertVectors(vectors)).rejects.toThrow('Upsert error');
    });
  });

  describe('query', () => {
    it('should query vectors from the index', async () => {
      const mockIndex = {
        query: jest.fn().mockResolvedValue({
          matches: [
            {
              id: 'test-1',
              score: 0.95,
              metadata: { text: 'test content' },
            },
            {
              id: 'test-2',
              score: 0.87,
              metadata: { text: 'another test' },
            },
          ],
        }),
      };
      mockPinecone.index.mockReturnValue(mockIndex);

      const queryVector = [0.1, 0.2, 0.3];
      const result = await vectorStore.query(queryVector, 5);

      expect(mockIndex.query).toHaveBeenCalledWith({
        vector: queryVector,
        topK: 5,
        includeMetadata: true,
      });

      expect(result).toEqual([
        {
          id: 'test-1',
          score: 0.95,
          metadata: { text: 'test content' },
        },
        {
          id: 'test-2',
          score: 0.87,
          metadata: { text: 'another test' },
        },
      ]);
    });

    it('should query with filter', async () => {
      const mockIndex = {
        query: jest.fn().mockResolvedValue({ matches: [] }),
      };
      mockPinecone.index.mockReturnValue(mockIndex);

      const queryVector = [0.1, 0.2, 0.3];
      const filter = { type: 'guide' };

      await vectorStore.query(queryVector, 5, filter);

      expect(mockIndex.query).toHaveBeenCalledWith({
        vector: queryVector,
        topK: 5,
        includeMetadata: true,
        filter,
      });
    });

    it('should handle query errors', async () => {
      const mockIndex = {
        query: jest.fn().mockRejectedValue(new Error('Query error')),
      };
      mockPinecone.index.mockReturnValue(mockIndex);

      const queryVector = [0.1, 0.2, 0.3];

      await expect(vectorStore.query(queryVector)).rejects.toThrow('Query error');
    });
  });

  describe('deleteVectors', () => {
    it('should delete vectors by IDs', async () => {
      const mockIndex = {
        deleteMany: jest.fn().mockResolvedValue({}),
      };
      mockPinecone.index.mockReturnValue(mockIndex);

      const ids = ['test-1', 'test-2'];

      await vectorStore.deleteVectors(ids);

      expect(mockIndex.deleteMany).toHaveBeenCalledWith(ids);
    });

    it('should handle delete errors', async () => {
      const mockIndex = {
        deleteMany: jest.fn().mockRejectedValue(new Error('Delete error')),
      };
      mockPinecone.index.mockReturnValue(mockIndex);

      const ids = ['test-1'];

      await expect(vectorStore.deleteVectors(ids)).rejects.toThrow('Delete error');
    });
  });

  describe('chunkText', () => {
    it('should chunk text into smaller pieces', () => {
      const text = 'This is a long text that should be chunked into smaller pieces for better processing.';
      const chunks = vectorStore.chunkText(text, { chunkSize: 20, overlap: 5 });

      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks.every(chunk => chunk.length <= 20)).toBe(true);
    });

    it('should handle empty text', () => {
      const chunks = vectorStore.chunkText('');
      expect(chunks).toEqual([]);
    });

    it('should use default options', () => {
      const text = 'Short text';
      const chunks = vectorStore.chunkText(text);

      expect(chunks).toEqual([text]);
    });
  });

  describe('processText', () => {
    it('should process text into vector items', async () => {
      const mockEmbedding = Array.from({ length: 768 }, () => Math.random());
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const mockGenAI = new GoogleGenerativeAI();
      const mockModel = mockGenAI.getGenerativeModel();
      mockModel.embedContent.mockResolvedValue({
        embedding: { values: mockEmbedding },
      });

      const text = 'This is a test text for processing.';
      const metadata = { source: 'test' };

      const result = await vectorStore.processText(text, metadata);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toMatchObject({
        id: expect.stringContaining('test_chunk_'),
        values: mockEmbedding,
        metadata: expect.objectContaining({
          source: 'test',
          chunkIndex: 0,
          text: expect.any(String),
          createdAt: expect.any(String),
        }),
      });
    });

    it('should handle processing errors', async () => {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const mockGenAI = new GoogleGenerativeAI();
      const mockModel = mockGenAI.getGenerativeModel();
      mockModel.embedContent.mockRejectedValue(new Error('Processing error'));

      const text = 'Test text';
      const metadata = { source: 'test' };

      await expect(vectorStore.processText(text, metadata)).rejects.toThrow('Processing error');
    });
  });

  describe('getIndexStats', () => {
    it('should get index statistics', async () => {
      const mockStats = {
        totalVectorCount: 100,
        dimension: 768,
        indexFullness: 0.1,
      };

      const mockIndex = {
        describeIndexStats: jest.fn().mockResolvedValue(mockStats),
      };
      mockPinecone.index.mockReturnValue(mockIndex);

      const result = await vectorStore.getIndexStats();

      expect(result).toEqual(mockStats);
      expect(mockIndex.describeIndexStats).toHaveBeenCalled();
    });

    it('should handle stats errors', async () => {
      const mockIndex = {
        describeIndexStats: jest.fn().mockRejectedValue(new Error('Stats error')),
      };
      mockPinecone.index.mockReturnValue(mockIndex);

      await expect(vectorStore.getIndexStats()).rejects.toThrow('Stats error');
    });
  });
});

describe('getVectorStore', () => {
  it('should return singleton instance', () => {
    const store1 = getVectorStore();
    const store2 = getVectorStore();

    expect(store1).toBe(store2);
  });

  it('should create new instance if none exists', () => {
    // Clear the singleton
    jest.resetModules();
    
    process.env.PINECONE_API_KEY = 'test-key';
    process.env.GOOGLE_GEMINI_API_KEY = 'test-key';

    const store = getVectorStore();
    expect(store).toBeDefined();
  });
});
