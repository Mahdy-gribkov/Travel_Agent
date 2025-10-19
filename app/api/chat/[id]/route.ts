import { NextRequest, NextResponse } from 'next/server';
import { createSecureHandler, SECURITY_PRESETS } from '@/lib/security/config';
import { ChatService } from '@/services/chat.service';

const chatService = new ChatService();

export const GET = createSecureHandler(
  SECURITY_PRESETS.chat,
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      
      const session = await chatService.getChatSession(id);
      if (!session) {
        return NextResponse.json(
          { success: false, error: 'Chat session not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: session,
      });
    } catch (error) {
      console.error('Error fetching chat session:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch chat session' },
        { status: 500 }
      );
    }
  }
);

export const PUT = createSecureHandler(
  SECURITY_PRESETS.chat,
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      const updateData = await request.json();
      
      const session = await chatService.getChatSession(id);
      if (!session) {
        return NextResponse.json(
          { success: false, error: 'Chat session not found' },
          { status: 404 }
        );
      }

      const updatedSession = await chatService.updateChatSession(id, updateData);

      return NextResponse.json({
        success: true,
        data: updatedSession,
        message: 'Chat session updated successfully',
      });
    } catch (error) {
      console.error('Error updating chat session:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update chat session' },
        { status: 500 }
      );
    }
  }
);

export const DELETE = createSecureHandler(
  SECURITY_PRESETS.chat,
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      
      const session = await chatService.getChatSession(id);
      if (!session) {
        return NextResponse.json(
          { success: false, error: 'Chat session not found' },
          { status: 404 }
        );
      }

      await chatService.deleteChatSession(id);

      return NextResponse.json({
        success: true,
        message: 'Chat session deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting chat session:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete chat session' },
        { status: 500 }
      );
    }
  }
);