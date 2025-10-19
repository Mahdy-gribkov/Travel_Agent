import { NextRequest, NextResponse } from 'next/server';

import { withValidation } from '@/lib/middleware/validation';
import { withQueryValidation } from '@/lib/middleware/validation';
import { ChatService } from '@/services/chat.service';
import { createChatSessionSchema, chatMessageSchema } from '@/lib/validations/schemas';
import { chatQuerySchema } from '@/lib/validations/schemas';

const chatService = new ChatService();

export async function GET(request: NextRequest) {
  return withQueryValidation(
    chatQuerySchema,
    async (req, queryData) => {
      return withAuth(
        req,
        async (authReq, token) => {
          try {
            const { page, limit, status, search } = queryData;
            const pageNum = parseInt(page || '1', 10) || 1;
            const limitNum = parseInt(limit || '10', 10) || 10;
            
            let result;
            if (search) {
              result = await chatService.searchChatSessions(
                token.uid as string,
                search,
                pageNum,
                limitNum
              );
            } else {
              result = await chatService.getUserChatSessions(
                token.uid as string,
                pageNum,
                limitNum,
                status
              );
            }

            return NextResponse.json({
              success: true,
              data: result.sessions,
              pagination: {
                page: pageNum,
                limit: limitNum,
                total: result.total,
                totalPages: Math.ceil(result.total / limitNum),
              },
            });
          } catch (error) {
            console.error('Error fetching chat sessions:', error);
            return NextResponse.json(
              { success: false, error: 'Failed to fetch chat sessions' },
              { status: 500 }
            );
          }
        }
      );
    }
  );
}

export async function POST(request: NextRequest) {
  return withValidation(
    createChatSessionSchema,
    async (req, data) => {
      return withAuth(
        req,
        async (authReq, token) => {
          try {
            const session = await chatService.createChatSession(
              token.uid as string,
              data
            );

            return NextResponse.json({
              success: true,
              data: session,
              message: 'Chat session created successfully',
            }, { status: 201 });
          } catch (error) {
            console.error('Error creating chat session:', error);
            return NextResponse.json(
              { success: false, error: 'Failed to create chat session' },
              { status: 500 }
            );
          }
        }
      );
    }
  );
}
