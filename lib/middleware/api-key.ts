import { NextRequest, NextResponse } from 'next/server';

export interface ApiKeyContext {
  apiKey: string;
  isAuthenticated: boolean;
}

export async function withApiKey(
  request: NextRequest,
  handler: (request: NextRequest, context: ApiKeyContext) => Promise<NextResponse>
) {
  try {
    // Check if APP_API_KEY is configured
    const expectedApiKey = process.env.APP_API_KEY;
    
    if (!expectedApiKey) {
      // If no API key is configured, allow all requests (open mode)
      return handler(request, { apiKey: '', isAuthenticated: false });
    }

    // Get API key from headers
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required', message: 'Please provide an API key in the x-api-key header or Authorization header' },
        { status: 401 }
      );
    }

    if (apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    return handler(request, { apiKey, isAuthenticated: true });
  } catch (error) {
    console.error('API key middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function withOptionalApiKey(
  request: NextRequest,
  handler: (request: NextRequest, context: ApiKeyContext) => Promise<NextResponse>
) {
  try {
    // Check if APP_API_KEY is configured
    const expectedApiKey = process.env.APP_API_KEY;
    
    if (!expectedApiKey) {
      // If no API key is configured, allow all requests (open mode)
      return handler(request, { apiKey: '', isAuthenticated: false });
    }

    // Get API key from headers
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      // No API key provided, but it's optional
      return handler(request, { apiKey: '', isAuthenticated: false });
    }

    if (apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    return handler(request, { apiKey, isAuthenticated: true });
  } catch (error) {
    console.error('API key middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
