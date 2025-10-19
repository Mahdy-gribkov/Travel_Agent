import { NextRequest, NextResponse } from 'next/server';
import { withValidation } from '@/lib/middleware/validation';
import { ChatService } from '@/services/chat.service';
import { chatMessageSchema } from '@/lib/validations/schemas';

const chatService = new ChatService();

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withValidation(
    chatMessageSchema,
    async (req, data) => {
      return withAuth(
        req,
        async (authReq, token) => {
          try {
            const { id } = params;
            
            const session = await chatService.getChatSession(id);
            if (!session) {
              return NextResponse.json(
                { success: false, error: 'Chat session not found' },
                { status: 404 }
              );
            }

            // Users can only add messages to their own chat sessions unless they're admin
            if (token.role !== 'admin' && session.userId !== token.uid) {
              return NextResponse.json(
                { success: false, error: 'Forbidden' },
                { status: 403 }
              );
            }

            const updatedSession = await chatService.addMessage(id, data);

            return NextResponse.json({
              success: true,
              data: updatedSession,
              message: 'Message added successfully',
            });
          } catch (error) {
            console.error('Error adding message:', error);
            return NextResponse.json(
              { success: false, error: 'Failed to add message' },
              { status: 500 }
            );
          }
        }
      );
    }
  );
}
