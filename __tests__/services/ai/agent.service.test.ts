/**
 * Unit tests for AI Agent Service
 */

import { AIAgentService } from '@/services/ai/agent.service';

// Mock LangChain
jest.mock('@langchain/google-genai', () => ({
  ChatGoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn(),
  })),
}));

jest.mock('langchain/agents', () => ({
  AgentExecutor: jest.fn().mockImplementation(() => ({
    invoke: jest.fn(),
  })),
  createToolCallingAgent: jest.fn(),
}));

jest.mock('@langchain/core/prompts', () => ({
  ChatPromptTemplate: {
    fromMessages: jest.fn(),
  },
  MessagesPlaceholder: jest.fn(),
}));

jest.mock('@langchain/core/messages', () => ({
  HumanMessage: jest.fn().mockImplementation((content) => ({ content, role: 'human' })),
  AIMessage: jest.fn().mockImplementation((content) => ({ content, role: 'ai' })),
}));

// Mock Firebase
jest.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: jest.fn().mockReturnValue({
      doc: jest.fn().mockReturnValue({
        set: jest.fn(),
        get: jest.fn(),
        update: jest.fn(),
      }),
      add: jest.fn(),
      where: jest.fn().mockReturnValue({
        orderBy: jest.fn().mockReturnValue({
          get: jest.fn(),
        }),
      }),
      get: jest.fn(),
    }),
  },
}));

// Mock Vector Store
jest.mock('@/lib/vector/pinecone', () => ({
  getVectorStore: jest.fn().mockReturnValue({
    generateEmbedding: jest.fn().mockResolvedValue(Array.from({ length: 768 }, () => Math.random())),
    query: jest.fn().mockResolvedValue([
      {
        id: 'test-result',
        score: 0.95,
        metadata: { text: 'Test content', type: 'guide' },
      },
    ]),
  }),
}));

describe('AIAgentService', () => {
  let agentService: AIAgentService;
  let mockModel: any;
  let mockAgent: any;

  beforeEach(() => {
    // Set up environment variables
    process.env.GOOGLE_GEMINI_API_KEY = 'test-gemini-key';

    // Reset mocks
    jest.clearAllMocks();

    // Get mocked instances
    const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
    const { AgentExecutor } = require('langchain/agents');

    mockModel = new ChatGoogleGenerativeAI();
    mockAgent = new AgentExecutor();

    agentService = new AIAgentService();
  });

  afterEach(() => {
    delete process.env.GOOGLE_GEMINI_API_KEY;
  });

  describe('constructor', () => {
    it('should throw error if GOOGLE_GEMINI_API_KEY is missing', () => {
      delete process.env.GOOGLE_GEMINI_API_KEY;
      expect(() => new AIAgentService()).toThrow('GOOGLE_GEMINI_API_KEY environment variable is required');
    });

    it('should initialize with valid API key', () => {
      expect(agentService).toBeDefined();
    });
  });

  describe('processMessage', () => {
    const mockContext = {
      userId: 'test-user',
      sessionId: 'test-session',
      conversationHistory: [],
      userPreferences: { budget: 1000 },
    };

    it('should process a message successfully', async () => {
      const mockResult = {
        output: 'I can help you plan your trip to Tokyo!',
        intermediateSteps: [
          {
            action: {
              tool: 'search_travel_guides',
              toolInput: { query: 'Tokyo travel guide' },
            },
            observation: 'Found 5 travel guides for Tokyo',
          },
        ],
      };

      mockAgent.invoke.mockResolvedValue(mockResult);

      const result = await agentService.processMessage('I want to visit Tokyo', mockContext);

      expect(result.response).toBe('I can help you plan your trip to Tokyo!');
      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].tool).toBe('search_travel_guides');
      expect(result.actions[0].success).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      mockAgent.invoke.mockRejectedValue(new Error('Agent error'));

      const result = await agentService.processMessage('Test message', mockContext);

      expect(result.response).toBe('I apologize, but I encountered an error processing your request. Please try again.');
      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].tool).toBe('error');
      expect(result.actions[0].success).toBe(false);
    });

    it('should block unauthorized tools', async () => {
      const mockResult = {
        output: 'Response',
        intermediateSteps: [
          {
            action: {
              tool: 'unauthorized_tool',
              toolInput: { query: 'test' },
            },
            observation: 'Tool executed',
          },
        ],
      };

      mockAgent.invoke.mockResolvedValue(mockResult);

      const result = await agentService.processMessage('Test message', mockContext);

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].tool).toBe('unauthorized_tool');
      expect(result.actions[0].success).toBe(false);
      expect(result.actions[0].error).toBe('Tool not in allowlist');
    });

    it('should log interactions to Firestore', async () => {
      const mockResult = {
        output: 'Response',
        intermediateSteps: [],
      };

      mockAgent.invoke.mockResolvedValue(mockResult);

      const { adminDb } = require('@/lib/firebase/admin');
      const mockAdd = jest.fn().mockResolvedValue({});
      adminDb.collection.mockReturnValue({ add: mockAdd });

      await agentService.processMessage('Test message', mockContext);

      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user',
          sessionId: 'test-session',
          userMessage: 'Test message',
          aiResponse: 'Response',
          actions: expect.any(Array),
          timestamp: expect.any(String),
        })
      );
    });
  });

  describe('getConversationHistory', () => {
    it('should retrieve conversation history from Firestore', async () => {
      const mockSnapshot = {
        forEach: jest.fn().mockImplementation((callback) => {
          callback({
            data: () => ({
              userMessage: 'Hello',
              aiResponse: 'Hi there!',
              timestamp: new Date().toISOString(),
            }),
          });
        }),
      };

      const { adminDb } = require('@/lib/firebase/admin');
      adminDb.collection.mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue(mockSnapshot),
          }),
        }),
      });

      const history = await agentService.getConversationHistory('test-session');

      expect(history).toHaveLength(2); // User message + AI response
      expect(adminDb.collection).toHaveBeenCalledWith('agent_interactions');
    });

    it('should handle errors when retrieving history', async () => {
      const { adminDb } = require('@/lib/firebase/admin');
      adminDb.collection.mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            get: jest.fn().mockRejectedValue(new Error('Firestore error')),
          }),
        }),
      });

      const history = await agentService.getConversationHistory('test-session');

      expect(history).toEqual([]);
    });
  });

  describe('getAgentStats', () => {
    it('should return agent statistics', async () => {
      const mockInteractionsSnapshot = {
        size: 10,
        forEach: jest.fn().mockImplementation((callback) => {
          callback({
            data: () => ({
              actions: [
                { tool: 'search_travel_guides', success: true },
                { tool: 'get_weather', success: true },
              ],
            }),
          });
        }),
      };

      const mockLogsSnapshot = {
        size: 25,
      };

      const { adminDb } = require('@/lib/firebase/admin');
      adminDb.collection.mockImplementation((collectionName) => {
        if (collectionName === 'agent_interactions') {
          return { get: jest.fn().mockResolvedValue(mockInteractionsSnapshot) };
        } else if (collectionName === 'agent_logs') {
          return { get: jest.fn().mockResolvedValue(mockLogsSnapshot) };
        }
        return { get: jest.fn() };
      });

      const stats = await agentService.getAgentStats();

      expect(stats).toEqual({
        totalInteractions: 10,
        totalLogs: 25,
        toolUsage: {
          search_travel_guides: 10,
          get_weather: 10,
        },
        allowedTools: expect.any(Array),
      });
    });

    it('should handle errors when getting stats', async () => {
      const { adminDb } = require('@/lib/firebase/admin');
      adminDb.collection.mockReturnValue({
        get: jest.fn().mockRejectedValue(new Error('Firestore error')),
      });

      const stats = await agentService.getAgentStats();

      expect(stats).toEqual({ error: 'Failed to get stats' });
    });
  });

  describe('tool functionality', () => {
    it('should have all required tools', () => {
      // Access private tools property through any type
      const tools = (agentService as any).tools;
      expect(tools).toBeDefined();
      expect(tools.length).toBeGreaterThan(0);

      const toolNames = tools.map((tool: any) => tool.name);
      expect(toolNames).toContain('search_travel_guides');
      expect(toolNames).toContain('search_itineraries');
      expect(toolNames).toContain('get_weather');
      expect(toolNames).toContain('get_flight_info');
      expect(toolNames).toContain('get_place_info');
      expect(toolNames).toContain('calculate_budget');
      expect(toolNames).toContain('create_itinerary');
      expect(toolNames).toContain('update_itinerary');
      expect(toolNames).toContain('get_user_preferences');
      expect(toolNames).toContain('log_agent_action');
    });

    it('should validate tool allowlist', () => {
      const allowedTools = (agentService as any).ALLOWED_TOOLS;
      expect(allowedTools).toBeDefined();
      expect(allowedTools.length).toBeGreaterThan(0);
      expect(allowedTools).toContain('search_travel_guides');
      expect(allowedTools).toContain('log_agent_action');
    });
  });

  describe('error handling', () => {
    it('should handle tool execution errors', async () => {
      const mockContext = {
        userId: 'test-user',
        sessionId: 'test-session',
        conversationHistory: [],
      };

      // Mock a tool that throws an error
      const { getVectorStore } = require('@/lib/vector/pinecone');
      getVectorStore().generateEmbedding.mockRejectedValue(new Error('Embedding error'));

      const mockResult = {
        output: 'Response',
        intermediateSteps: [
          {
            action: {
              tool: 'search_travel_guides',
              toolInput: { query: 'test' },
            },
            observation: 'Error occurred',
          },
        ],
      };

      mockAgent.invoke.mockResolvedValue(mockResult);

      const result = await agentService.processMessage('Test message', mockContext);

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].success).toBe(true); // Tool execution success is determined by the agent
    });
  });
});
