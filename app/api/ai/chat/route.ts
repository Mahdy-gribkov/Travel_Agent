import { NextRequest, NextResponse } from 'next/server';
import { secure } from '@/lib/security';
import { AIAgentService } from '@/services/ai/agent.service';
import { ChatService } from '@/services/chat.service';
import { UserService } from '@/services/user.service';
import { aiChatRequestSchema } from '@/lib/validations/schemas';

const agentService = new AIAgentService();
const chatService = new ChatService();
const userService = new UserService();

export const POST = secure.chat(async (req, context) => {
  try {
    const body = await req.json();
    const { message, sessionId, context: chatContext, attachments } = body;
    
    // Get user ID from context (set by security middleware)
    const userId = context?.userId || req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID not found' },
        { status: 401 }
      );
    }
    
    // Get or create chat session
    let session;
    if (sessionId) {
      session = await chatService.getChatSession(sessionId);
      if (!session || session.userId !== userId) {
        return NextResponse.json(
          { success: false, error: 'Chat session not found' },
          { status: 404 }
        );
      }
    } else {
      session = await chatService.createChatSession(userId, {
        title: message.substring(0, 50) + '...',
        context: chatContext,
      });
    }

    // Get user preferences
    const user = await userService.getUserById(userId);
    
    // Add user message to session
    await chatService.addMessage(session.id, {
      content: message,
      role: 'user',
      attachments,
    });

    // Process message with AI agent
    const agentContext: any = {
      userId,
      conversationHistory: session.messages,
      activeTools: chatContext?.activeTools || [],
    };
    
    if (chatContext?.currentItinerary) {
      agentContext.currentItinerary = chatContext.currentItinerary;
    }
    
    if (user?.preferences) {
      agentContext.userPreferences = user.preferences;
    }

    const aiResponse = await agentService.processMessage(message, agentContext);

    // Add AI response to session
    const updatedSession = await chatService.addMessage(session.id, {
      content: aiResponse,
      role: 'assistant',
    });

    return NextResponse.json({
      success: true,
      data: {
        session: updatedSession,
        response: aiResponse,
      },
      message: 'Message processed successfully',
    });
  } catch (error) {
    console.error('Error processing chat message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process message' },
      { status: 500 }
    );
  }
});
