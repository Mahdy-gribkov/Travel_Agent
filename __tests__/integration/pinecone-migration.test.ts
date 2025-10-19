/**
 * Integration tests for Pinecone migration script
 */

import { PineconeMigration } from '../../scripts/migrate-to-pinecone';

// Mock Firebase Admin
jest.mock('../../lib/firebase/admin', () => ({
  adminDb: {
    collection: jest.fn().mockReturnValue({
      get: jest.fn(),
    }),
  },
}));

// Mock Pinecone
jest.mock('../../lib/vector/pinecone', () => ({
  getVectorStore: jest.fn().mockReturnValue({
    init: jest.fn().mockResolvedValue(undefined),
    generateEmbedding: jest.fn().mockResolvedValue(Array.from({ length: 768 }, () => Math.random())),
    query: jest.fn().mockResolvedValue([]),
    upsertVectors: jest.fn().mockResolvedValue(undefined),
    processText: jest.fn().mockResolvedValue([
      {
        id: 'test_chunk_0',
        values: Array.from({ length: 768 }, () => Math.random()),
        metadata: {
          text: 'test content',
          documentId: 'test-doc',
          chunkIndex: 0,
          totalChunks: 1,
          createdAt: new Date().toISOString(),
        },
      },
    ]),
  }),
}));

// Mock Ingestion Service
jest.mock('../../services/ai/ingestion.service', () => ({
  IngestionService: jest.fn().mockImplementation(() => ({
    ingestItineraryData: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('PineconeMigration Integration Tests', () => {
  let migration: PineconeMigration;
  let mockAdminDb: any;
  let mockVectorStore: any;
  let mockIngestionService: any;

  beforeEach(() => {
    // Set up environment variables
    process.env.PINECONE_API_KEY = 'test-pinecone-key';
    process.env.GOOGLE_GEMINI_API_KEY = 'test-gemini-key';
    process.env.FIREBASE_PROJECT_ID = 'test-project';
    process.env.FIREBASE_PRIVATE_KEY = 'test-private-key';
    process.env.FIREBASE_CLIENT_EMAIL = 'test@example.com';

    // Get mocked instances
    const { adminDb } = require('../../lib/firebase/admin');
    const { getVectorStore } = require('../../lib/vector/pinecone');
    const { IngestionService } = require('../../services/ai/ingestion.service');

    mockAdminDb = adminDb;
    mockVectorStore = getVectorStore();
    mockIngestionService = new IngestionService();

    migration = new PineconeMigration();

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.PINECONE_API_KEY;
    delete process.env.GOOGLE_GEMINI_API_KEY;
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_PRIVATE_KEY;
    delete process.env.FIREBASE_CLIENT_EMAIL;
  });

  describe('run', () => {
    it('should complete migration successfully with sample data', async () => {
      // Mock Firestore data
      const mockGuidesSnapshot = {
        size: 2,
        forEach: jest.fn().mockImplementation((callback) => {
          callback({
            id: 'guide-1',
            data: () => ({
              title: 'Tokyo Guide',
              content: 'Tokyo travel guide content',
              location: 'Tokyo, Japan',
              type: 'guide',
            }),
          });
          callback({
            id: 'guide-2',
            data: () => ({
              title: 'Paris Guide',
              content: 'Paris travel guide content',
              location: 'Paris, France',
              type: 'guide',
            }),
          });
        }),
      };

      const mockItinerariesSnapshot = {
        size: 1,
        forEach: jest.fn().mockImplementation((callback) => {
          callback({
            id: 'itinerary-1',
            data: () => ({
              title: 'Europe Trip',
              destination: 'Europe',
              days: [],
              type: 'itinerary',
            }),
          });
        }),
      };

      const mockTipsSnapshot = {
        size: 0,
        forEach: jest.fn(),
      };

      const mockDestinationsSnapshot = {
        size: 0,
        forEach: jest.fn(),
      };

      // Mock collection calls
      mockAdminDb.collection.mockImplementation((collectionName: string) => {
        switch (collectionName) {
          case 'travel_guides':
            return { get: jest.fn().mockResolvedValue(mockGuidesSnapshot) };
          case 'itineraries':
            return { get: jest.fn().mockResolvedValue(mockItinerariesSnapshot) };
          case 'travel_tips':
            return { get: jest.fn().mockResolvedValue(mockTipsSnapshot) };
          case 'destinations':
            return { get: jest.fn().mockResolvedValue(mockDestinationsSnapshot) };
          default:
            return { get: jest.fn().mockResolvedValue({ size: 0, forEach: jest.fn() }) };
        }
      });

      // Mock console methods to capture output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      try {
        await migration.run();

        // Verify Pinecone initialization
        expect(mockVectorStore.init).toHaveBeenCalled();

        // Verify Firestore collections were queried
        expect(mockAdminDb.collection).toHaveBeenCalledWith('travel_guides');
        expect(mockAdminDb.collection).toHaveBeenCalledWith('itineraries');
        expect(mockAdminDb.collection).toHaveBeenCalledWith('travel_tips');
        expect(mockAdminDb.collection).toHaveBeenCalledWith('destinations');

        // Verify ingestion service was called
        expect(mockIngestionService.ingestItineraryData).toHaveBeenCalledTimes(3); // 2 guides + 1 itinerary

        // Verify console output
        expect(consoleSpy).toHaveBeenCalledWith('🚀 Starting Pinecone migration...');
        expect(consoleSpy).toHaveBeenCalledWith('✅ Pinecone initialized successfully');
        expect(consoleSpy).toHaveBeenCalledWith('📊 Found 3 documents to migrate');

      } finally {
        consoleSpy.mockRestore();
        consoleErrorSpy.mockRestore();
      }
    });

    it('should handle empty Firestore collections', async () => {
      // Mock empty collections
      const emptySnapshot = {
        size: 0,
        forEach: jest.fn(),
      };

      mockAdminDb.collection.mockReturnValue({
        get: jest.fn().mockResolvedValue(emptySnapshot),
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      try {
        await migration.run();

        expect(consoleSpy).toHaveBeenCalledWith('ℹ️  No documents found to migrate');
        expect(mockIngestionService.ingestItineraryData).not.toHaveBeenCalled();

      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should handle Firestore connection errors', async () => {
      mockAdminDb.collection.mockReturnValue({
        get: jest.fn().mockRejectedValue(new Error('Firestore connection error')),
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      try {
        await expect(migration.run()).rejects.toThrow('Firestore connection error');
        expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Error fetching documents from Firestore:', expect.any(Error));

      } finally {
        consoleErrorSpy.mockRestore();
      }
    });

    it('should handle Pinecone initialization errors', async () => {
      mockVectorStore.init.mockRejectedValue(new Error('Pinecone initialization error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      try {
        await expect(migration.run()).rejects.toThrow('Pinecone initialization error');
        expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Migration failed:', expect.any(Error));

      } finally {
        consoleErrorSpy.mockRestore();
      }
    });

    it('should handle document processing errors gracefully', async () => {
      // Mock Firestore data with one document
      const mockSnapshot = {
        size: 1,
        forEach: jest.fn().mockImplementation((callback) => {
          callback({
            id: 'test-doc',
            data: () => ({
              title: 'Test Document',
              content: 'Test content',
            }),
          });
        }),
      };

      mockAdminDb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'travel_guides') {
          return { get: jest.fn().mockResolvedValue(mockSnapshot) };
        }
        return { get: jest.fn().mockResolvedValue({ size: 0, forEach: jest.fn() }) };
      });

      // Mock ingestion service to throw error
      mockIngestionService.ingestItineraryData.mockRejectedValue(new Error('Processing error'));

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      try {
        await migration.run();

        // Should complete despite individual document errors
        expect(consoleSpy).toHaveBeenCalledWith('🎉 Migration completed!');
        expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Failed to migrate document test-doc:', 'Processing error');

      } finally {
        consoleSpy.mockRestore();
        consoleErrorSpy.mockRestore();
      }
    });

    it('should process documents in batches', async () => {
      // Mock 25 documents to test batching
      const mockSnapshot = {
        size: 25,
        forEach: jest.fn().mockImplementation((callback) => {
          for (let i = 0; i < 25; i++) {
            callback({
              id: `doc-${i}`,
              data: () => ({
                title: `Document ${i}`,
                content: `Content ${i}`,
              }),
            });
          }
        }),
      };

      mockAdminDb.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'travel_guides') {
          return { get: jest.fn().mockResolvedValue(mockSnapshot) };
        }
        return { get: jest.fn().mockResolvedValue({ size: 0, forEach: jest.fn() }) };
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      try {
        await migration.run();

        // Should process in batches of 10
        expect(consoleSpy).toHaveBeenCalledWith('🔄 Processing 25 documents in 3 batches of 10');
        expect(consoleSpy).toHaveBeenCalledWith('📦 Processing batch 1/3 (10 documents)');
        expect(consoleSpy).toHaveBeenCalledWith('📦 Processing batch 2/3 (10 documents)');
        expect(consoleSpy).toHaveBeenCalledWith('📦 Processing batch 3/3 (5 documents)');

        // Should call ingestion service for all documents
        expect(mockIngestionService.ingestItineraryData).toHaveBeenCalledTimes(25);

      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('formatDocumentForMigration', () => {
    it('should format guide documents correctly', () => {
      const guideDoc = {
        id: 'guide-1',
        title: 'Tokyo Guide',
        content: 'Tokyo travel content',
        location: 'Tokyo, Japan',
        type: 'guide',
      };

      // Access private method through any type
      const formatted = (migration as any).formatDocumentForMigration(guideDoc);

      expect(formatted).toMatchObject({
        id: 'guide-1',
        title: 'Tokyo Guide',
        destination: 'Tokyo, Japan',
        content: 'Tokyo travel content',
        type: 'guide',
        metadata: expect.objectContaining({
          migratedAt: expect.any(String),
          migrationSource: 'firestore',
        }),
      });
    });

    it('should format itinerary documents correctly', () => {
      const itineraryDoc = {
        id: 'itinerary-1',
        title: 'Europe Trip',
        destination: 'Europe',
        startDate: '2024-01-01',
        endDate: '2024-01-10',
        travelers: 2,
        budget: 5000,
        days: [],
      };

      const formatted = (migration as any).formatDocumentForMigration(itineraryDoc);

      expect(formatted).toMatchObject({
        id: 'itinerary-1',
        title: 'Europe Trip',
        destination: 'Europe',
        startDate: '2024-01-01',
        endDate: '2024-01-10',
        travelers: 2,
        budget: 5000,
        days: [],
      });
    });

    it('should handle documents with missing fields', () => {
      const minimalDoc = {
        id: 'minimal-doc',
      };

      const formatted = (migration as any).formatDocumentForMigration(minimalDoc);

      expect(formatted).toMatchObject({
        id: 'minimal-doc',
        title: 'Document minimal-doc',
        destination: 'Unknown',
        travelers: 1,
        budget: 0,
        days: [],
      });
    });
  });

  describe('isDocumentAlreadyMigrated', () => {
    it('should return true if document exists in Pinecone', async () => {
      mockVectorStore.query.mockResolvedValue([
        { id: 'existing-doc', score: 0.9, metadata: {} },
      ]);

      const result = await (migration as any).isDocumentAlreadyMigrated('existing-doc');

      expect(result).toBe(true);
      expect(mockVectorStore.query).toHaveBeenCalledWith(
        expect.any(Array),
        1,
        { documentId: 'existing-doc' }
      );
    });

    it('should return false if document does not exist in Pinecone', async () => {
      mockVectorStore.query.mockResolvedValue([]);

      const result = await (migration as any).isDocumentAlreadyMigrated('non-existing-doc');

      expect(result).toBe(false);
    });

    it('should return false on query errors', async () => {
      mockVectorStore.query.mockRejectedValue(new Error('Query error'));

      const result = await (migration as any).isDocumentAlreadyMigrated('error-doc');

      expect(result).toBe(false);
    });
  });
});
