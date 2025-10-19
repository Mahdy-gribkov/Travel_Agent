/**
 * Unit tests for Chat Service
 */

import { ChatService } from '@/services/chat.service';

// Mock dependencies
jest.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn(),
        get: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
      where: jest.fn(() => ({
        orderBy: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn(),
          })),
        })),
      })),
      get: jest.fn(),
    })),
  },
}));

jest.mock('@/services/ai/agent.service', () => ({
  AIAgentService: jest.fn().mockImplementation(() => ({
    processMessage: jest.fn(),
    getConversationHistory: jest.fn(),
    getAgentStats: jest.fn(),
  })),
}));

describe('ChatService', () => {
  let chatService: ChatService;
  let mockAIAgent: any;

  beforeEach(() => {
    chatService = new ChatService();
    
    // Get the mocked AI agent instance
    const { AIAgentService } = require('@/services/ai/agent.service');
    mockAIAgent = new AIAgentService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createChatSession', () => {
    it('should create a new chat session', async () => {
      const sessionData = {
        title: 'Test Chat',
        context: {
          activeTools: ['search_travel_guides'],
        },
      };

      const { adminDb } = require('@/lib/firebase/admin');
      const mockDoc = {
        set: jest.fn(),
      };
      adminDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc),
      });

      const result = await chatService.createChatSession('test-user', sessionData);

      expect(result).toMatchObject({
        userId: 'test-user',
        title: 'Test Chat',
        messages: [],
        context: {
          conversationMemory: [],
          activeTools: ['search_travel_guides'],
        },
        status: 'active',
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should create session with default values', async () => {
      const { adminDb } = require('@/lib/firebase/admin');
      const mockDoc = {
        set: jest.fn(),
      };
      adminDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc),
      });

      const result = await chatService.createChatSession('test-user', {});

      expect(result.title).toBe('New Chat');
      expect(result.context.activeTools).toEqual([]);
    });
  });

  describe('getChatSession', () => {
    it('should retrieve a chat session', async () => {
      const mockSession = {
        id: 'test-session',
        userId: 'test-user',
        title: 'Test Chat',
        messages: [],
        status: 'active',
      };

      const { adminDb } = require('@/lib/firebase/admin');
      const mockDoc = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => mockSession,
        }),
      };
      adminDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc),
      });

      const result = await chatService.getChatSession('test-session');

      expect(result).toEqual(mockSession);
    });

    it('should return null for non-existent session', async () => {
      const { adminDb } = require('@/lib/firebase/admin');
      const mockDoc = {
        get: jest.fn().mockResolvedValue({
          exists: false,
        }),
      };
      adminDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc),
      });

      const result = await chatService.getChatSession('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('addMessage', () => {
    it('should add a message to a chat session', async () => {
      const mockSession = {
        id: 'test-session',
        userId: 'test-user',
        title: 'Test Chat',
        messages: [],
        status: 'active',
        context: {
          conversationMemory: [],
          activeTools: [],
        },
      };

      const { adminDb } = require('@/lib/firebase/admin');
      const mockDoc = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => mockSession,
        }),
        update: jest.fn(),
      };
      adminDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc),
      });

      const messageData = {
        role: 'user' as const,
        content: 'Hello, world!',
      };

      const result = await chatService.addMessage('test-session', messageData);

      expect(result).toMatchObject({
        id: expect.any(String),
        role: 'user',
        content: 'Hello, world!',
        timestamp: expect.any(Date),
      });
    });
  });

  describe('processMessageWithAI', () => {
    it('should process a message with AI agent', async () => {
      const mockSession = {
        id: 'test-session',
        userId: 'test-user',
        title: 'Test Chat',
        messages: [],
        status: 'active',
        context: {
          conversationMemory: [],
          activeTools: [],
        },
      };

      const mockAIResponse = {
        response: 'AI response',
        actions: [
          {
            tool: 'search_travel_guides',
            success: true,
            timestamp: new Date(),
          },
        ],
      };

      const { adminDb } = require('@/lib/firebase/admin');
      const mockDoc = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => mockSession,
        }),
        update: jest.fn(),
      };
      adminDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc),
      });

      mockAIAgent.processMessage.mockResolvedValue(mockAIResponse);
      mockAIAgent.getConversationHistory.mockResolvedValue([]);

      const result = await chatService.processMessageWithAI(
        'test-session',
        'Hello, AI!',
        'test-user'
      );

      expect(result).toMatchObject({
        session: expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: 'Hello, AI!',
            }),
            expect.objectContaining({
              role: 'assistant',
              content: 'AI response',
            }),
          ]),
        }),
        aiResponse: 'AI response',
        actions: mockAIResponse.actions,
      });
    });

    it('should throw error for non-existent session', async () => {
      const { adminDb } = require('@/lib/firebase/admin');
      const mockDoc = {
        get: jest.fn().mockResolvedValue({
          exists: false,
        }),
      };
      adminDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc),
      });

      await expect(
        chatService.processMessageWithAI('non-existent', 'Hello!', 'test-user')
      ).rejects.toThrow('Chat session not found');
    });
  });

  describe('getUserChatSessions', () => {
    it('should retrieve user chat sessions', async () => {
      const mockSessions = [
        { id: 'session1', title: 'Chat 1' },
        { id: 'session2', title: 'Chat 2' },
      ];

      const { adminDb } = require('@/lib/firebase/admin');
      const mockQuery = {
        get: jest.fn().mockResolvedValue({
          docs: mockSessions.map(session => ({
            id: session.id,
            data: () => session,
          })),
          size: mockSessions.length,
        }),
      };
      adminDb.collection.mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue(mockQuery),
          }),
        }),
      });

      const result = await chatService.getUserChatSessions('test-user', 1, 10);

      expect(result).toEqual({
        sessions: mockSessions,
        total: mockSessions.length,
      });
    });
  });

  describe('updateChatSession', () => {
    it('should update a chat session', async () => {
      const mockSession = {
        id: 'test-session',
        userId: 'test-user',
        title: 'Original Title',
        messages: [],
        status: 'active',
      };

      const { adminDb } = require('@/lib/firebase/admin');
      const mockDoc = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => mockSession,
        }),
        update: jest.fn(),
      };
      adminDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc),
      });

      const updateData = {
        title: 'Updated Title',
        status: 'archived' as const,
      };

      const result = await chatService.updateChatSession('test-session', updateData);

      expect(result).toMatchObject({
        ...mockSession,
        title: 'Updated Title',
        status: 'archived',
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('deleteChatSession', () => {
    it('should delete a chat session', async () => {
      const { adminDb } = require('@/lib/firebase/admin');
      const mockDoc = {
        delete: jest.fn(),
      };
      adminDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc),
      });

      await chatService.deleteChatSession('test-session');

      expect(mockDoc.delete).toHaveBeenCalled();
    });
  });

  describe('searchChatSessions', () => {
    it('should search chat sessions by title', async () => {
      const mockSessions = [
        { id: 'session1', title: 'Travel to Paris' },
        { id: 'session2', title: 'Paris vacation planning' },
      ];

      const { adminDb } = require('@/lib/firebase/admin');
      const mockQuery = {
        get: jest.fn().mockResolvedValue({
          docs: mockSessions.map(session => ({
            id: session.id,
            data: () => session,
          })),
          size: mockSessions.length,
        }),
      };
      adminDb.collection.mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue(mockQuery),
          }),
        }),
      });

      const result = await chatService.searchChatSessions('test-user', 'Paris', 1, 10);

      expect(result).toEqual({
        sessions: mockSessions,
        total: mockSessions.length,
      });
    });
  });

  describe('getAgentStats', () => {
    it('should get AI agent statistics', async () => {
      const mockStats = {
        totalInteractions: 100,
        totalLogs: 50,
        toolUsage: {
          'search_travel_guides': 25,
          'get_weather': 15,
        },
      };

      mockAIAgent.getAgentStats.mockResolvedValue(mockStats);

      const result = await chatService.getAgentStats();

      expect(result).toEqual(mockStats);
    });
  });
});