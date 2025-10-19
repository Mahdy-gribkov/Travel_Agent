'use client';

import { useState } from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    actions?: Array<{
      tool: string;
      success: boolean;
      timestamp: Date;
      error?: string;
    }>;
  };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (message: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Simulate AI response - in real implementation, this would call the API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I received your message: "${message}". This is a placeholder response. In the real implementation, this would be processed by the AI agent.`,
        timestamp: new Date(),
        metadata: {
          actions: [
            {
              tool: 'search_travel_guides',
              success: true,
              timestamp: new Date(),
            },
          ],
        },
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 h-[calc(100vh-200px)]">
      <ChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        placeholder="Ask me anything about your travel plans..."
      />
    </div>
  );
}
