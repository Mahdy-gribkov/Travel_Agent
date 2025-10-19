import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withValidation } from '@/lib/middleware/validation';
import { ChatService } from '@/services/chat.service';
import { chatMessageSchema } from '@/lib/validations/schemas';

const chatService = new ChatService();
const rateLimit = withRateLimit();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(
    request,
    async (req, token) => {
      try {
        const { id } = params;
        
        const session = await chatService.getChatSession(id);
        if (!session) {
          return NextResponse.json(
            { success: false, error: 'Chat session not found' },
            { status: 404 }
          );
        }

        // Users can only access their own chat sessions unless they're admin
        if (token.role !== 'admin' && session.userId !== token.uid) {
          return NextResponse.json(
            { success: false, error: 'Forbidden' },
            { status: 403 }
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
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(
    request,
    async (req, token) => {
      try {
        const { id } = params;
        const updateData = await req.json();
        
        const session = await chatService.getChatSession(id);
        if (!session) {
          return NextResponse.json(
            { success: false, error: 'Chat session not found' },
            { status: 404 }
          );
        }

        // Users can only update their own chat sessions unless they're admin
        if (token.role !== 'admin' && session.userId !== token.uid) {
          return NextResponse.json(
            { success: false, error: 'Forbidden' },
            { status: 403 }
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
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(
    request,
    async (req, token) => {
      try {
        const { id } = params;
        
        const session = await chatService.getChatSession(id);
        if (!session) {
          return NextResponse.json(
            { success: false, error: 'Chat session not found' },
            { status: 404 }
          );
        }

        // Users can only delete their own chat sessions unless they're admin
        if (token.role !== 'admin' && session.userId !== token.uid) {
          return NextResponse.json(
            { success: false, error: 'Forbidden' },
            { status: 403 }
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
}
