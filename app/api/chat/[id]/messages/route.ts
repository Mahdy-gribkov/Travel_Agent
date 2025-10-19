import { NextRequest, NextResponse } from 'next/server';
import { createSecureHandler, SECURITY_PRESETS } from '@/lib/security/config';
import { ChatService } from '@/services/chat.service';
import { chatMessageSchema } from '@/lib/validations/schemas';

const chatService = new ChatService();

export const POST = createSecureHandler(
  SECURITY_PRESETS.chat,
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      const body = await request.json();
      
      // Validate the message data
      const messageData = chatMessageSchema.parse(body);
      
      const session = await chatService.getChatSession(id);
      if (!session) {
        return NextResponse.json(
          { success: false, error: 'Chat session not found' },
          { status: 404 }
        );
      }

      // If it's a user message, process it with the AI agent
      if (messageData.role === 'user') {
        const result = await chatService.processMessageWithAI(id, messageData.content);
        
        return NextResponse.json({
          success: true,
          data: {
            session: result.session,
            aiResponse: result.aiResponse,
            actions: result.actions,
          },
          message: 'Message processed with AI agent',
        });
      } else {
        // For non-user messages, just add them normally
        const updatedSession = await chatService.addMessage(id, messageData);
        
        return NextResponse.json({
          success: true,
          data: updatedSession,
          message: 'Message added successfully',
        });
      }
    } catch (error) {
      console.error('Error processing message:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to process message' },
        { status: 500 }
      );
    }
  }
);