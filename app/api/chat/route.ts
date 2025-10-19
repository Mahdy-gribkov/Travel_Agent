import { NextRequest, NextResponse } from 'next/server';
import { createSecureHandler, SECURITY_PRESETS } from '@/lib/security/config';
import { ChatService } from '@/services/chat.service';
import { createChatSessionSchema } from '@/lib/validations/schemas';

const chatService = new ChatService();

export const GET = createSecureHandler(
  SECURITY_PRESETS.chat,
  async (request: NextRequest) => {
    try {
      const url = new URL(request.url);
      const page = url.searchParams.get('page');
      const limit = url.searchParams.get('limit');
      const status = url.searchParams.get('status') as any;
      const search = url.searchParams.get('search');
      
      const pageNum = parseInt(page || '1', 10) || 1;
      const limitNum = parseInt(limit || '10', 10) || 10;
      
      // For now, use a default user ID since we don't have session-based auth
      const userId = 'default-user';
      
      let result;
      if (search) {
        result = await chatService.searchChatSessions(
          userId,
          search,
          pageNum,
          limitNum
        );
      } else {
        result = await chatService.getUserChatSessions(
          userId,
          pageNum,
          limitNum,
          status || 'active'
        );
      }

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Chat sessions retrieved successfully',
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

export const POST = createSecureHandler(
  SECURITY_PRESETS.chat,
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const sessionData = createChatSessionSchema.parse(body);
      
      // For now, use a default user ID since we don't have session-based auth
      const userId = 'default-user';
      
      const session = await chatService.createChatSession(userId, sessionData);

      return NextResponse.json({
        success: true,
        data: session,
        message: 'Chat session created successfully',
      });
    } catch (error) {
      console.error('Error creating chat session:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create chat session' },
        { status: 500 }
      );
    }
  }
);