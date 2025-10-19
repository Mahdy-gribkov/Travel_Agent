/**
 * AI Agent Service with LangChain + Gemini + MCP integration
 * Provides a stable, tool-controlled AI agent for travel assistance
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { DynamicTool } from '@langchain/core/tools';
import { adminDb } from '@/lib/firebase/admin';
import { getVectorStore } from '@/lib/vector/pinecone';

// Tool allowlist - only these tools are allowed
const ALLOWED_TOOLS = [
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

export interface AgentContext {
  userId: string;
  sessionId: string;
  conversationHistory: BaseMessage[];
  userPreferences?: Record<string, any>;
}

export interface AgentAction {
  tool: string;
  success: boolean;
  timestamp: Date;
  error?: string;
}

export class AIAgentService {
  private model: ChatGoogleGenerativeAI;
  private tools: DynamicTool[];
  private agent: AgentExecutor;
  private vectorStore = getVectorStore();

  constructor() {
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      throw new Error('GOOGLE_GEMINI_API_KEY environment variable is required');
    }

    this.model = new ChatGoogleGenerativeAI({
      modelName: 'gemini-1.5-pro',
      temperature: 0.7,
      maxOutputTokens: 2048,
      apiKey: process.env.GOOGLE_GEMINI_API_KEY,
    });

    this.tools = this.createTools();
    this.agent = new AgentExecutor({
      agent: createToolCallingAgent({
        llm: this.model,
        tools: this.tools,
        prompt: ChatPromptTemplate.fromMessages([
          ['system', 'You are a helpful AI travel agent. Use the provided tools to assist users with their travel planning. Always try to use the tools to find relevant information before responding.'],
          ['human', '{input}'],
          ['placeholder', '{agent_scratchpad}'],
        ]),
      }),
      tools: this.tools,
      verbose: true,
    });
  }

  /**
   * Create allowed tools for the agent
   */
  private createTools(): DynamicTool[] {
    return [
      // Travel guide search
      new DynamicTool({
        name: 'search_travel_guides',
        description: 'Search for travel guides and information about destinations. Input should be a search query string.',
        func: async (input: string) => {
          try {
            const results = await this.vectorStore.query(
              await this.vectorStore.generateEmbedding(input),
              5
            );
            return JSON.stringify(results);
          } catch (error) {
            return `Error searching travel guides: ${error}`;
          }
        },
      }),

      // Itinerary search
      new DynamicTool({
        name: 'search_itineraries',
        description: 'Search for existing travel itineraries. Input should be a search query string.',
        func: async (input: string) => {
          try {
            const results = await this.vectorStore.query(
              await this.vectorStore.generateEmbedding(input),
              3,
              { type: 'itinerary' }
            );
            return JSON.stringify(results);
    } catch (error) {
            return `Error searching itineraries: ${error}`;
          }
        },
      }),

      // Weather information
      new DynamicTool({
        name: 'get_weather',
        description: 'Get weather information for a location. Input should be a location string.',
        func: async (input: string) => {
          try {
            // Mock weather data - in a real implementation, you'd call a weather API
            return JSON.stringify({
              location: input,
              temperature: '22°C',
              condition: 'Sunny',
              humidity: '65%',
              wind: '10 km/h',
            });
    } catch (error) {
            return `Error getting weather: ${error}`;
          }
        },
      }),

      // Flight information
      new DynamicTool({
        name: 'get_flight_info',
        description: 'Get flight information between two locations. Input should be "origin to destination".',
        func: async (input: string) => {
          try {
            // Mock flight data - in a real implementation, you'd call a flight API
            return JSON.stringify({
              route: input,
              flights: [
                {
                  airline: 'Airline A',
                  departure: '08:00',
                  arrival: '10:30',
                  price: '$299',
                },
              ],
            });
    } catch (error) {
            return `Error getting flight info: ${error}`;
          }
        },
      }),

      // Place information
      new DynamicTool({
        name: 'get_place_info',
        description: 'Get detailed information about a place or attraction. Input should be a place name.',
        func: async (input: string) => {
          try {
            // Mock place data - in a real implementation, you'd call a places API
            return JSON.stringify({
              name: input,
              description: 'A beautiful place to visit',
              rating: 4.5,
              address: '123 Main St',
              hours: '9:00 AM - 6:00 PM',
            });
    } catch (error) {
            return `Error getting place info: ${error}`;
          }
        },
      }),

      // Budget calculation
      new DynamicTool({
        name: 'calculate_budget',
        description: 'Calculate travel budget for a trip. Input should be trip details.',
        func: async (input: string) => {
          try {
            // Mock budget calculation - in a real implementation, you'd calculate based on real data
            return JSON.stringify({
              totalBudget: '$1500',
              breakdown: {
                flights: '$600',
                accommodation: '$500',
                food: '$300',
                activities: '$100',
              },
            });
    } catch (error) {
            return `Error calculating budget: ${error}`;
          }
        },
      }),

      // Create itinerary
      new DynamicTool({
        name: 'create_itinerary',
        description: 'Create a new travel itinerary. Input should be itinerary details.',
        func: async (input: string) => {
          try {
            // Mock itinerary creation - in a real implementation, you'd save to database
            return JSON.stringify({
              id: 'itinerary_123',
              title: 'New Itinerary',
              status: 'created',
              message: 'Itinerary created successfully',
            });
    } catch (error) {
            return `Error creating itinerary: ${error}`;
          }
        },
      }),

      // Update itinerary
      new DynamicTool({
        name: 'update_itinerary',
        description: 'Update an existing travel itinerary. Input should be itinerary ID and updates.',
        func: async (input: string) => {
          try {
            // Mock itinerary update - in a real implementation, you'd update the database
            return JSON.stringify({
              id: 'itinerary_123',
              status: 'updated',
              message: 'Itinerary updated successfully',
            });
    } catch (error) {
            return `Error updating itinerary: ${error}`;
          }
        },
      }),

      // Get user preferences
      new DynamicTool({
        name: 'get_user_preferences',
        description: 'Get user travel preferences. Input should be user ID.',
        func: async (input: string) => {
          try {
            // Mock user preferences - in a real implementation, you'd fetch from database
            return JSON.stringify({
              userId: input,
              preferences: {
                budget: 'mid-range',
                travelStyle: 'adventure',
                interests: ['culture', 'nature'],
              },
            });
    } catch (error) {
            return `Error getting user preferences: ${error}`;
          }
        },
      }),

      // Log agent action
      new DynamicTool({
        name: 'log_agent_action',
        description: 'Log an agent action for transparency. Input should be action details.',
        func: async (input: string) => {
          try {
            // Log the action to Firestore
            await adminDb.collection('agent_logs').add({
              action: input,
              timestamp: new Date(),
              type: 'agent_action',
            });
            return 'Action logged successfully';
    } catch (error) {
            return `Error logging action: ${error}`;
          }
        },
      }),
    ];
  }

  /**
   * Process a message with the AI agent
   */
  async processMessage(input: string, context: AgentContext): Promise<{
    response: string;
    actions: AgentAction[];
  }> {
    try {
      // Validate that only allowed tools are used
      const result = await this.agent.invoke({ input });
      
      // Extract actions from the result
      const actions: AgentAction[] = [];
      if (result.intermediateSteps) {
        for (const step of result.intermediateSteps) {
          const toolName = step.action.tool;
          if (ALLOWED_TOOLS.includes(toolName)) {
            actions.push({
              tool: toolName,
              success: true,
              timestamp: new Date(),
            });
      } else {
            actions.push({
              tool: toolName,
              success: false,
              timestamp: new Date(),
              error: 'Tool not in allowlist',
            });
          }
        }
      }

      // Log the interaction to Firestore
      await this.logInteraction(context, input, result.output, actions);

      return {
        response: result.output,
        actions,
      };
    } catch (error) {
      console.error('Error processing message with AI agent:', error);
      
      const errorAction: AgentAction = {
        tool: 'error',
        success: false,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      // Log the error
      await this.logInteraction(context, input, 'Error occurred', [errorAction]);

      return {
        response: 'I apologize, but I encountered an error processing your request. Please try again.',
        actions: [errorAction],
      };
    }
  }

  /**
   * Get conversation history from Firestore
   */
  async getConversationHistory(sessionId: string): Promise<BaseMessage[]> {
    try {
      const snapshot = await adminDb
        .collection('agent_interactions')
        .where('sessionId', '==', sessionId)
        .orderBy('timestamp', 'asc')
        .get();

      const messages: BaseMessage[] = [];
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        if (data.userMessage) {
          messages.push(new HumanMessage(data.userMessage));
        }
        if (data.aiResponse) {
          messages.push(new AIMessage(data.aiResponse));
        }
      });

      return messages;
    } catch (error) {
      console.error('Error getting conversation history:', error);
      return [];
    }
  }

  /**
   * Log agent interaction to Firestore
   */
  private async logInteraction(
    context: AgentContext,
    userMessage: string,
    aiResponse: string,
    actions: AgentAction[]
  ): Promise<void> {
    try {
      await adminDb.collection('agent_interactions').add({
        userId: context.userId,
        sessionId: context.sessionId,
        userMessage,
        aiResponse,
        actions: actions.map(action => ({
          tool: action.tool,
          success: action.success,
          timestamp: action.timestamp,
          error: action.error,
        })),
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error logging interaction:', error);
    }
  }

  /**
   * Get agent statistics
   */
  async getAgentStats(): Promise<any> {
    try {
      const interactionsSnapshot = await adminDb.collection('agent_interactions').get();
      const logsSnapshot = await adminDb.collection('agent_logs').get();

      const toolUsage: Record<string, number> = {};
      interactionsSnapshot.forEach((doc: any) => {
        const data = doc.data();
        if (data.actions) {
          data.actions.forEach((action: any) => {
            toolUsage[action.tool] = (toolUsage[action.tool] || 0) + 1;
          });
        }
      });

      return {
        totalInteractions: interactionsSnapshot.size,
        totalLogs: logsSnapshot.size,
        toolUsage,
        allowedTools: ALLOWED_TOOLS,
      };
    } catch (error) {
      console.error('Error getting agent stats:', error);
      return { error: 'Failed to get stats' };
    }
  }
}
