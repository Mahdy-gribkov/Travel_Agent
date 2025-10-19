/**
 * AI Agent Service with LangChain + Gemini + MCP integration
 * Provides a stable, tool-controlled AI agent for travel assistance
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { Tool } from '@langchain/core/tools';
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
] as const;

type AllowedTool = typeof ALLOWED_TOOLS[number];

interface AgentAction {
  tool: string;
  input: Record<string, any>;
  output?: any;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  success: boolean;
  error?: string;
}

interface AgentContext {
  userId?: string;
  sessionId: string;
  conversationHistory: BaseMessage[];
  userPreferences?: Record<string, any>;
}

export class AIAgentService {
  private model: ChatGoogleGenerativeAI;
  private tools: Tool[];
  private agent: AgentExecutor;
  private vectorStore = getVectorStore();

  constructor() {
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      throw new Error('GOOGLE_GEMINI_API_KEY environment variable is required');
    }

    this.model = new ChatGoogleGenerativeAI({
      model: 'gemini-1.5-pro',
      apiKey: process.env.GOOGLE_GEMINI_API_KEY,
      temperature: 0.7,
      maxOutputTokens: 2048,
    });

    this.tools = this.createTools();
    this.agent = this.createAgent();
  }

  /**
   * Create the agent with tools and prompt
   */
  private createAgent(): AgentExecutor {
    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are a helpful travel assistant AI agent. You help users plan trips, find information, and create itineraries.

Your capabilities include:
- Searching travel guides and itineraries
- Getting weather information
- Finding flight information
- Getting place details
- Calculating budgets
- Creating and updating itineraries
- Accessing user preferences

Guidelines:
- Always be helpful and informative
- Provide accurate, up-to-date information
- Respect user preferences and constraints
- Log all significant actions for transparency
- If you don't know something, say so and suggest alternatives
- Focus on practical, actionable advice

Current conversation context:
- User ID: {userId}
- Session ID: {sessionId}
- User preferences: {userPreferences}`,
      ],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}'],
      new MessagesPlaceholder('agent_scratchpad'),
    ]);

    const agent = createToolCallingAgent({
      llm: this.model,
      tools: this.tools,
      prompt,
    });

    return new AgentExecutor({
      agent,
      tools: this.tools,
      verbose: process.env.NODE_ENV === 'development',
      maxIterations: 5,
      earlyStoppingMethod: 'generate',
    });
  }

  /**
   * Create allowed tools for the agent
   */
  private createTools(): Tool[] {
    return [
      // Travel guide search
      new Tool({
        name: 'search_travel_guides',
        description: 'Search for travel guides and information about destinations',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for travel guides',
            },
            location: {
              type: 'string',
              description: 'Specific location to search for',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return',
              default: 5,
            },
          },
          required: ['query'],
        },
        func: async ({ query, location, limit = 5 }) => {
          try {
            const results = await this.vectorStore.query(
              await this.vectorStore.generateEmbedding(query),
              limit,
              location ? { location: { $regex: location, $options: 'i' } } : undefined
            );

            return JSON.stringify({
              success: true,
              results: results.map(r => ({
                id: r.id,
                content: r.metadata?.text || r.metadata?.originalContent || '',
                metadata: r.metadata,
                score: r.score,
              })),
            });
          } catch (error) {
            return JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        },
      }),

      // Itinerary search
      new Tool({
        name: 'search_itineraries',
        description: 'Search for existing itineraries',
        parameters: {
          type: 'object',
          properties: {
            destination: {
              type: 'string',
              description: 'Destination to search for',
            },
            duration: {
              type: 'number',
              description: 'Trip duration in days',
            },
            budget: {
              type: 'number',
              description: 'Budget range',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return',
              default: 5,
            },
          },
          required: ['destination'],
        },
        func: async ({ destination, duration, budget, limit = 5 }) => {
          try {
            const filter: any = { type: 'itinerary' };
            if (destination) filter.destination = { $regex: destination, $options: 'i' };
            if (duration) filter.duration = duration;
            if (budget) filter.budget = { $lte: budget };

            const results = await this.vectorStore.query(
              await this.vectorStore.generateEmbedding(destination),
              limit,
              filter
            );

            return JSON.stringify({
              success: true,
              results: results.map(r => ({
                id: r.id,
                content: r.metadata?.text || r.metadata?.originalContent || '',
                metadata: r.metadata,
                score: r.score,
              })),
            });
          } catch (error) {
            return JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        },
      }),

      // Weather information
      new Tool({
        name: 'get_weather',
        description: 'Get current weather and forecast for a location',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'Location to get weather for',
            },
            days: {
              type: 'number',
              description: 'Number of days for forecast',
              default: 5,
            },
          },
          required: ['location'],
        },
        func: async ({ location, days = 5 }) => {
          try {
            // This would integrate with a weather service
            // For now, return mock data
            return JSON.stringify({
              success: true,
              location,
              current: {
                temperature: 22,
                condition: 'Sunny',
                humidity: 65,
              },
              forecast: Array.from({ length: days }, (_, i) => ({
                date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
                high: 25,
                low: 18,
                condition: 'Partly Cloudy',
              })),
            });
          } catch (error) {
            return JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        },
      }),

      // Flight information
      new Tool({
        name: 'get_flight_info',
        description: 'Get flight information and prices',
        parameters: {
          type: 'object',
          properties: {
            origin: {
              type: 'string',
              description: 'Origin airport/city',
            },
            destination: {
              type: 'string',
              description: 'Destination airport/city',
            },
            departureDate: {
              type: 'string',
              description: 'Departure date (YYYY-MM-DD)',
            },
            returnDate: {
              type: 'string',
              description: 'Return date (YYYY-MM-DD)',
            },
            passengers: {
              type: 'number',
              description: 'Number of passengers',
              default: 1,
            },
          },
          required: ['origin', 'destination', 'departureDate'],
        },
        func: async ({ origin, destination, departureDate, returnDate, passengers = 1 }) => {
          try {
            // This would integrate with a flight API
            // For now, return mock data
            return JSON.stringify({
              success: true,
              flights: [
                {
                  airline: 'Example Airlines',
                  price: 450,
                  departure: `${departureDate}T08:00:00Z`,
                  arrival: `${departureDate}T12:00:00Z`,
                  duration: '4h 00m',
                },
              ],
            });
          } catch (error) {
            return JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        },
      }),

      // Place information
      new Tool({
        name: 'get_place_info',
        description: 'Get detailed information about a place or attraction',
        parameters: {
          type: 'object',
          properties: {
            place: {
              type: 'string',
              description: 'Name of the place or attraction',
            },
            location: {
              type: 'string',
              description: 'Location/city of the place',
            },
          },
          required: ['place'],
        },
        func: async ({ place, location }) => {
          try {
            // This would integrate with a places API
            // For now, return mock data
            return JSON.stringify({
              success: true,
              place: {
                name: place,
                location: location || 'Unknown',
                description: `Information about ${place}`,
                rating: 4.5,
                priceRange: '$$',
                hours: '9:00 AM - 6:00 PM',
                address: '123 Example Street',
              },
            });
          } catch (error) {
            return JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        },
      }),

      // Budget calculation
      new Tool({
        name: 'calculate_budget',
        description: 'Calculate estimated budget for a trip',
        parameters: {
          type: 'object',
          properties: {
            destination: {
              type: 'string',
              description: 'Travel destination',
            },
            duration: {
              type: 'number',
              description: 'Trip duration in days',
            },
            travelers: {
              type: 'number',
              description: 'Number of travelers',
              default: 1,
            },
            accommodationType: {
              type: 'string',
              description: 'Type of accommodation (budget, mid-range, luxury)',
              default: 'mid-range',
            },
          },
          required: ['destination', 'duration'],
        },
        func: async ({ destination, duration, travelers = 1, accommodationType = 'mid-range' }) => {
          try {
            // Mock budget calculation
            const baseCosts = {
              budget: { accommodation: 50, food: 30, activities: 20 },
              'mid-range': { accommodation: 100, food: 60, activities: 40 },
              luxury: { accommodation: 250, food: 120, activities: 100 },
            };

            const costs = baseCosts[accommodationType as keyof typeof baseCosts] || baseCosts['mid-range'];
            const dailyCost = (costs.accommodation + costs.food + costs.activities) * travelers;
            const totalCost = dailyCost * duration;

            return JSON.stringify({
              success: true,
              budget: {
                destination,
                duration,
                travelers,
                accommodationType,
                dailyCost,
                totalCost,
                breakdown: {
                  accommodation: costs.accommodation * travelers * duration,
                  food: costs.food * travelers * duration,
                  activities: costs.activities * travelers * duration,
                },
              },
            });
          } catch (error) {
            return JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        },
      }),

      // Create itinerary
      new Tool({
        name: 'create_itinerary',
        description: 'Create a new travel itinerary',
        parameters: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Itinerary title',
            },
            destination: {
              type: 'string',
              description: 'Travel destination',
            },
            startDate: {
              type: 'string',
              description: 'Start date (YYYY-MM-DD)',
            },
            endDate: {
              type: 'string',
              description: 'End date (YYYY-MM-DD)',
            },
            travelers: {
              type: 'number',
              description: 'Number of travelers',
              default: 1,
            },
            budget: {
              type: 'number',
              description: 'Total budget',
            },
            preferences: {
              type: 'object',
              description: 'User preferences',
            },
          },
          required: ['title', 'destination', 'startDate', 'endDate'],
        },
        func: async ({ title, destination, startDate, endDate, travelers = 1, budget, preferences }) => {
          try {
            const itinerary = {
              id: `itinerary_${Date.now()}`,
              title,
              destination,
              startDate,
              endDate,
              travelers,
              budget,
              preferences: preferences || {},
              createdAt: new Date().toISOString(),
              status: 'draft',
            };

            // Save to Firestore
            await adminDb.collection('itineraries').doc(itinerary.id).set(itinerary);

            return JSON.stringify({
              success: true,
              itinerary,
            });
          } catch (error) {
            return JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        },
      }),

      // Update itinerary
      new Tool({
        name: 'update_itinerary',
        description: 'Update an existing itinerary',
        parameters: {
          type: 'object',
          properties: {
            itineraryId: {
              type: 'string',
              description: 'ID of the itinerary to update',
            },
            updates: {
              type: 'object',
              description: 'Updates to apply to the itinerary',
            },
          },
          required: ['itineraryId', 'updates'],
        },
        func: async ({ itineraryId, updates }) => {
          try {
            const docRef = adminDb.collection('itineraries').doc(itineraryId);
            await docRef.update({
              ...updates,
              updatedAt: new Date().toISOString(),
            });

            const updatedDoc = await docRef.get();
            const updatedItinerary = updatedDoc.data();

            return JSON.stringify({
              success: true,
              itinerary: updatedItinerary,
            });
          } catch (error) {
            return JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        },
      }),

      // Get user preferences
      new Tool({
        name: 'get_user_preferences',
        description: 'Get user preferences and settings',
        parameters: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'User ID to get preferences for',
            },
          },
          required: ['userId'],
        },
        func: async ({ userId }) => {
          try {
            const userDoc = await adminDb.collection('users').doc(userId).get();
            const userData = userDoc.data();

            return JSON.stringify({
              success: true,
              preferences: userData?.preferences || {},
              settings: userData?.settings || {},
            });
          } catch (error) {
            return JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        },
      }),

      // Log agent action
      new Tool({
        name: 'log_agent_action',
        description: 'Log an agent action for transparency and debugging',
        parameters: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              description: 'Description of the action taken',
            },
            details: {
              type: 'object',
              description: 'Additional details about the action',
            },
            userId: {
              type: 'string',
              description: 'User ID if available',
            },
          },
          required: ['action'],
        },
        func: async ({ action, details, userId }) => {
          try {
            const logEntry = {
              action,
              details: details || {},
              userId: userId || 'anonymous',
              timestamp: new Date().toISOString(),
              sessionId: 'current-session', // This would be passed from context
            };

            await adminDb.collection('agent_logs').add(logEntry);

            return JSON.stringify({
              success: true,
              logged: true,
            });
          } catch (error) {
            return JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        },
      }),
    ];
  }

  /**
   * Process a user message with the AI agent
   */
  async processMessage(
    message: string,
    context: AgentContext
  ): Promise<{ response: string; actions: AgentAction[] }> {
    try {
      // Add user message to conversation history
      const humanMessage = new HumanMessage(message);
      context.conversationHistory.push(humanMessage);

      // Execute agent
      const result = await this.agent.invoke({
        input: message,
        chat_history: context.conversationHistory.slice(0, -1), // Exclude the current message
        userId: context.userId || 'anonymous',
        sessionId: context.sessionId,
        userPreferences: JSON.stringify(context.userPreferences || {}),
      });

      // Add AI response to conversation history
      const aiMessage = new AIMessage(result.output);
      context.conversationHistory.push(aiMessage);

      // Extract actions from the result
      const actions = this.extractActionsFromResult(result, context);

      // Log the interaction
      await this.logInteraction(context, message, result.output, actions);

      return {
        response: result.output,
        actions,
      };
    } catch (error) {
      console.error('Error processing message with AI agent:', error);
      
      const errorAction: AgentAction = {
        tool: 'error',
        input: { message, error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date(),
        userId: context.userId,
        sessionId: context.sessionId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      return {
        response: 'I apologize, but I encountered an error processing your request. Please try again.',
        actions: [errorAction],
      };
    }
  }

  /**
   * Extract actions from agent execution result
   */
  private extractActionsFromResult(result: any, context: AgentContext): AgentAction[] {
    const actions: AgentAction[] = [];

    if (result.intermediateSteps) {
      for (const step of result.intermediateSteps) {
        if (step.action && step.observation) {
          const action: AgentAction = {
            tool: step.action.tool,
            input: step.action.toolInput,
            output: step.observation,
            timestamp: new Date(),
            userId: context.userId,
            sessionId: context.sessionId,
            success: true,
          };

          // Validate tool is in allowlist
          if (ALLOWED_TOOLS.includes(step.action.tool as AllowedTool)) {
            actions.push(action);
          } else {
            console.warn(`Blocked unauthorized tool: ${step.action.tool}`);
            action.success = false;
            action.error = 'Tool not in allowlist';
            actions.push(action);
          }
        }
      }
    }

    return actions;
  }

  /**
   * Log interaction to Firestore
   */
  private async logInteraction(
    context: AgentContext,
    userMessage: string,
    aiResponse: string,
    actions: AgentAction[]
  ): Promise<void> {
    try {
      const interaction = {
        userId: context.userId || 'anonymous',
        sessionId: context.sessionId,
        userMessage,
        aiResponse,
        actions,
        timestamp: new Date().toISOString(),
        metadata: {
          conversationLength: context.conversationHistory.length,
          userPreferences: context.userPreferences,
        },
      };

      await adminDb.collection('agent_interactions').add(interaction);
    } catch (error) {
      console.error('Error logging interaction:', error);
    }
  }

  /**
   * Get conversation history for a session
   */
  async getConversationHistory(sessionId: string): Promise<BaseMessage[]> {
    try {
      const snapshot = await adminDb
        .collection('agent_interactions')
        .where('sessionId', '==', sessionId)
        .orderBy('timestamp', 'asc')
        .get();

      const messages: BaseMessage[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        messages.push(new HumanMessage(data.userMessage));
        messages.push(new AIMessage(data.aiResponse));
      });

      return messages;
    } catch (error) {
      console.error('Error getting conversation history:', error);
      return [];
    }
  }

  /**
   * Get agent statistics
   */
  async getAgentStats(): Promise<any> {
    try {
      const [interactionsSnapshot, logsSnapshot] = await Promise.all([
        adminDb.collection('agent_interactions').get(),
        adminDb.collection('agent_logs').get(),
      ]);

      const totalInteractions = interactionsSnapshot.size;
      const totalLogs = logsSnapshot.size;

      // Count tool usage
      const toolUsage: Record<string, number> = {};
      interactionsSnapshot.forEach(doc => {
        const actions = doc.data().actions || [];
        actions.forEach((action: AgentAction) => {
          toolUsage[action.tool] = (toolUsage[action.tool] || 0) + 1;
        });
      });

      return {
        totalInteractions,
        totalLogs,
        toolUsage,
        allowedTools: ALLOWED_TOOLS,
      };
    } catch (error) {
      console.error('Error getting agent stats:', error);
      return { error: 'Failed to get stats' };
    }
  }
}