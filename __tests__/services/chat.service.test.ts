/**
 * Unit tests for Chat Service with AI Agent integration
 */

import { ChatService } from '@/services/chat.service';

// Mock Firebase
jest.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: jest.fn().mockReturnValue({
      doc: jest.fn().mockReturnValue({
        set: jest.fn(),
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            id: 'test-session',
            userId: 'test-user',
            title: 'Test Chat',
            messages: [],
            context: { conversationMemory: [] },
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        }),
        update: jest.fn(),
      }),
      where: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          offset: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({
                  docs: [],
                  size: 0,
                }),
              }),
            }),
          }),
        }),
      }),
    }),
  },
}));

// Mock AI Agent Service
jest.mock('@/services/ai/agent.service', () => ({
  AIAgentService: jest.fn().mockImplementation(() => ({
    processMessage: jest.fn().mockResolvedValue({
      response: 'AI response',
      actions: [
        {
          tool: 'search_travel_guides',
          success: true,
          timestamp: new Date(),
        },
      ],
    }),
    getConversationHistory: jest.fn().mockResolvedValue([]),
    getAgentStats: jest.fn().mockResolvedValue({
      totalInteractions: 10,
      totalLogs: 5,
      toolUsage: { search_travel_guides: 5 },
    }),
  })),
}));

// Mock validation schemas
jest.mock('@/lib/validations/schemas', () => ({
  createChatSessionSchema: {
    parse: jest.fn().mockImplementation((data) => data),
  },
  chatMessageSchema: {
    parse: jest.fn().mockImplementation((data) => data),
  },
}));

describe('ChatService', () => {
  let chatService: ChatService;
  let mockAdminDb: any;
  let mockAIAgent: any;

  beforeEach(() => {
    // Get mocked instances
    const { adminDb } = require('@/lib/firebase/admin');
    const { AIAgentService } = require('@/services/ai/agent.service');

    mockAdminDb = adminDb;
    mockAIAgent = new AIAgentService();

    chatService = new ChatService();

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('createChatSession', () => {
    it('should create a new chat session', async () => {
      const sessionData = {
        title: 'New Chat Session',
        context: { activeTools: ['search'] },
      };

      const result = await chatService.createChatSession('test-user', sessionData);

      expect(result).toMatchObject({
        userId: 'test-user',
        title: 'New Chat Session',
        status: 'active',
        context: expect.objectContaining({
          activeTools: ['search'],
        }),
      });

      expect(mockAdminDb.collection().doc().set).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user',
          title: 'New Chat Session',
        })
      );
    });

    it('should use default values when not provided', async () => {
      const result = await chatService.createChatSession('test-user', {});

      expect(result.title).toBe('New Chat');
      expect(result.context.conversationMemory).toEqual([]);
    });
  });

  describe('getChatSession', () => {
    it('should retrieve an existing chat session', async () => {
      const result = await chatService.getChatSession('test-session');

      expect(result).toMatchObject({
        id: 'test-session',
        userId: 'test-user',
        title: 'Test Chat',
      });

      expect(mockAdminDb.collection().doc().get).toHaveBeenCalled();
    });

    it('should return null for non-existent session', async () => {
      mockAdminDb.collection().doc().get.mockResolvedValue({
        exists: false,
      });

      const result = await chatService.getChatSession('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('addMessage', () => {
    it('should add a message to a chat session', async () => {
      const messageData = {
        role: 'user',
        content: 'Hello, world!',
      };

      const result = await chatService.addMessage('test-session', messageData);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0]).toMatchObject({
        role: 'user',
        content: 'Hello, world!',
      });

      expect(mockAdminDb.collection().doc().update).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.any(Array),
          context: expect.any(Object),
          updatedAt: expect.any(Date),
        })
      );
    });

    it('should throw error for non-existent session', async () => {
      mockAdminDb.collection().doc().get.mockResolvedValue({
        exists: false,
      });

      await expect(
        chatService.addMessage('non-existent', { role: 'user', content: 'test' })
      ).rejects.toThrow('Chat session not found');
    });
  });

  describe('processMessageWithAI', () => {
    it('should process a message with AI agent', async () => {
      const result = await chatService.processMessageWithAI(
        'test-session',
        'I want to visit Tokyo',
        'test-user'
      );

      expect(result.aiResponse).toBe('AI response');
      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].tool).toBe('search_travel_guides');
      expect(result.session.messages).toHaveLength(2); // User message + AI response

      // Verify AI agent was called
      expect(mockAIAgent.processMessage).toHaveBeenCalledWith(
        'I want to visit Tokyo',
        expect.objectContaining({
          userId: 'test-user',
          sessionId: 'test-session',
        })
      );
    });

    it('should handle AI agent errors gracefully', async () => {
      mockAIAgent.processMessage.mockRejectedValue(new Error('AI error'));

      await expect(
        chatService.processMessageWithAI('test-session', 'test message', 'test-user')
      ).rejects.toThrow('AI error');
    });

    it('should use anonymous user when userId not provided', async () => {
      await chatService.processMessageWithAI('test-session', 'test message');

      expect(mockAIAgent.processMessage).toHaveBeenCalledWith(
        'test message',
        expect.objectContaining({
          userId: 'anonymous',
          sessionId: 'test-session',
        })
      );
    });

    it('should update conversation memory with both messages', async () => {
      const result = await chatService.processMessageWithAI(
        'test-session',
        'test message',
        'test-user'
      );

      expect(result.session.context.conversationMemory).toHaveLength(2);
      expect(result.session.context.lastAgentActions).toBeDefined();
    });
  });

  describe('getUserChatSessions', () => {
    it('should retrieve user chat sessions with pagination', async () => {
      const result = await chatService.getUserChatSessions('test-user', 1, 10, 'active');

      expect(result.sessions).toEqual([]);
      expect(result.total).toBe(0);

      expect(mockAdminDb.collection().where).toHaveBeenCalledWith('userId', '==', 'test-user');
      expect(mockAdminDb.collection().where).toHaveBeenCalledWith('status', '==', 'active');
    });
  });

  describe('searchChatSessions', () => {
    it('should search chat sessions by query', async () => {
      const mockSessions = [
        {
          id: 'session1',
          title: 'Tokyo Trip',
          messages: [{ content: 'Planning a trip to Tokyo' }],
        },
        {
          id: 'session2',
          title: 'Paris Vacation',
          messages: [{ content: 'Planning a vacation to Paris' }],
        },
      ];

      mockAdminDb.collection().where().where().offset().limit().orderBy().get.mockResolvedValue({
        docs: mockSessions.map(session => ({ data: () => session })),
      });

      const result = await chatService.searchChatSessions('test-user', 'Tokyo');

      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].title).toBe('Tokyo Trip');
    });
  });

  describe('updateChatSession', () => {
    it('should update a chat session', async () => {
      const updateData = { title: 'Updated Title' };

      const result = await chatService.updateChatSession('test-session', updateData);

      expect(result.title).toBe('Updated Title');
      expect(mockAdminDb.collection().doc().update).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updateData,
          updatedAt: expect.any(Date),
        })
      );
    });

    it('should throw error for non-existent session', async () => {
      mockAdminDb.collection().doc().get.mockResolvedValue({
        exists: false,
      });

      await expect(
        chatService.updateChatSession('non-existent', { title: 'test' })
      ).rejects.toThrow('Chat session not found');
    });
  });

  describe('deleteChatSession', () => {
    it('should mark session as deleted', async () => {
      await chatService.deleteChatSession('test-session');

      expect(mockAdminDb.collection().doc().update).toHaveBeenCalledWith({
        status: 'deleted',
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('archiveChatSession', () => {
    it('should archive a chat session', async () => {
      const result = await chatService.archiveChatSession('test-session');

      expect(result.status).toBe('archived');
    });
  });

  describe('getAgentStats', () => {
    it('should get AI agent statistics', async () => {
      const stats = await chatService.getAgentStats();

      expect(stats).toEqual({
        totalInteractions: 10,
        totalLogs: 5,
        toolUsage: { search_travel_guides: 5 },
      });

      expect(mockAIAgent.getAgentStats).toHaveBeenCalled();
    });
  });

  describe('conversation memory management', () => {
    it('should limit conversation memory to 10 messages', () => {
      const memory = Array.from({ length: 12 }, (_, i) => `message ${i}`);
      const message = { role: 'user', content: 'new message' };

      // Access private method through any type
      const updatedMemory = (chatService as any).updateConversationMemory(memory, message);

      expect(updatedMemory).toHaveLength(10);
      expect(updatedMemory[9]).toBe('user: new message');
    });

    it('should add messages to conversation memory', () => {
      const memory = ['message 1', 'message 2'];
      const message = { role: 'assistant', content: 'AI response' };

      const updatedMemory = (chatService as any).updateConversationMemory(memory, message);

      expect(updatedMemory).toHaveLength(3);
      expect(updatedMemory[2]).toBe('assistant: AI response');
    });
  });

  describe('ID generation', () => {
    it('should generate unique session IDs', () => {
      const id1 = (chatService as any).generateId();
      const id2 = (chatService as any).generateId();

      expect(id1).toMatch(/^chat_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^chat_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('should generate unique message IDs', () => {
      const id1 = (chatService as any).generateMessageId();
      const id2 = (chatService as any).generateMessageId();

      expect(id1).toMatch(/^msg_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^msg_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });
});
