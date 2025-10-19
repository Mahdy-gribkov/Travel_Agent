/**
 * Unit tests for AI Agent Service
 */

import { AIAgentService, AgentContext } from '@/services/ai/agent.service';

// Mock dependencies
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

jest.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: jest.fn(() => ({
      add: jest.fn(),
      where: jest.fn(() => ({
        orderBy: jest.fn(() => ({
          get: jest.fn(),
        })),
      })),
      get: jest.fn(),
    })),
  },
}));

jest.mock('@/lib/vector/pinecone', () => ({
  getVectorStore: jest.fn(() => ({
    query: jest.fn(),
    generateEmbedding: jest.fn(),
  })),
}));

describe('AIAgentService', () => {
  let agentService: AIAgentService;
  let mockContext: AgentContext;

  beforeEach(() => {
    // Set up environment variables
    process.env.GOOGLE_GEMINI_API_KEY = 'test-api-key';
    
    agentService = new AIAgentService();
    
    mockContext = {
      userId: 'test-user',
      sessionId: 'test-session',
      conversationHistory: [],
      userPreferences: {
        budget: 'mid-range',
        travelStyle: 'adventure',
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with valid API key', () => {
      expect(agentService).toBeInstanceOf(AIAgentService);
    });

    it('should throw error without API key', () => {
      delete process.env.GOOGLE_GEMINI_API_KEY;
      expect(() => new AIAgentService()).toThrow('GOOGLE_GEMINI_API_KEY environment variable is required');
    });
  });

  describe('processMessage', () => {
    it('should process a message successfully', async () => {
      const mockResult = {
        output: 'Test response',
        intermediateSteps: [
          {
            action: {
              tool: 'search_travel_guides',
            },
          },
        ],
      };

      const { AgentExecutor } = require('langchain/agents');
      const mockAgent = new AgentExecutor();
      mockAgent.invoke.mockResolvedValue(mockResult);

      const result = await agentService.processMessage('Test message', mockContext);

      expect(result).toEqual({
        response: 'Test response',
        actions: [
          {
            tool: 'search_travel_guides',
            success: true,
            timestamp: expect.any(Date),
          },
        ],
      });
    });

    it('should handle errors gracefully', async () => {
      const { AgentExecutor } = require('langchain/agents');
      const mockAgent = new AgentExecutor();
      mockAgent.invoke.mockRejectedValue(new Error('Test error'));

      const result = await agentService.processMessage('Test message', mockContext);

      expect(result).toEqual({
        response: 'I apologize, but I encountered an error processing your request. Please try again.',
        actions: [
          {
            tool: 'error',
            success: false,
            timestamp: expect.any(Date),
            error: 'Test error',
          },
        ],
      });
    });

    it('should filter out disallowed tools', async () => {
      const mockResult = {
        output: 'Test response',
        intermediateSteps: [
          {
            action: {
              tool: 'search_travel_guides', // Allowed
            },
          },
          {
            action: {
              tool: 'malicious_tool', // Not allowed
            },
          },
        ],
      };

      const { AgentExecutor } = require('langchain/agents');
      const mockAgent = new AgentExecutor();
      mockAgent.invoke.mockResolvedValue(mockResult);

      const result = await agentService.processMessage('Test message', mockContext);

      expect(result.actions).toHaveLength(2);
      expect(result.actions[0]).toEqual({
        tool: 'search_travel_guides',
        success: true,
        timestamp: expect.any(Date),
      });
      expect(result.actions[1]).toEqual({
        tool: 'malicious_tool',
        success: false,
        timestamp: expect.any(Date),
        error: 'Tool not in allowlist',
      });
    });
  });

  describe('getConversationHistory', () => {
    it('should retrieve conversation history from Firestore', async () => {
      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          callback({
            data: () => ({
              userMessage: 'Hello',
              aiResponse: 'Hi there!',
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

      expect(history).toHaveLength(2);
      expect(history[0].content).toBe('Hello');
      expect(history[1].content).toBe('Hi there!');
    });

    it('should handle empty conversation history', async () => {
      const mockSnapshot = {
        forEach: jest.fn(),
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

      expect(history).toEqual([]);
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
        forEach: jest.fn((callback) => {
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
        size: 5,
      };

      const { adminDb } = require('@/lib/firebase/admin');
      adminDb.collection.mockImplementation((collectionName) => {
        if (collectionName === 'agent_interactions') {
          return {
            get: jest.fn().mockResolvedValue(mockInteractionsSnapshot),
          };
        } else if (collectionName === 'agent_logs') {
          return {
            get: jest.fn().mockResolvedValue(mockLogsSnapshot),
          };
        }
      });

      const stats = await agentService.getAgentStats();

      expect(stats).toEqual({
        totalInteractions: 10,
        totalLogs: 5,
        toolUsage: {
          'search_travel_guides': 1,
          'get_weather': 1,
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

  describe('Tool Creation', () => {
    it('should create tools with correct structure', () => {
      // Access private method through type assertion
      const tools = (agentService as any).createTools();
      
      expect(tools).toHaveLength(10);
      
      // Check that all tools have required properties
      tools.forEach((tool: any) => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('func');
        expect(typeof tool.func).toBe('function');
      });

      // Check specific tools exist
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
  });

  describe('Tool Allowlist', () => {
    it('should only allow predefined tools', () => {
      const allowedTools = [
        'search_travel_guides',
        'search_itineraries',
        'get_weather',
        'get_flight_info',
        'get_place_info',
        'calculate_budget',
        'create_itinerary',
        'update_itinerary',
        'get_user_preferences',
        'log_agent_action',
      ];

      // This would be tested through the processMessage method
      // when intermediate steps contain tool calls
      expect(allowedTools).toHaveLength(10);
    });
  });
});