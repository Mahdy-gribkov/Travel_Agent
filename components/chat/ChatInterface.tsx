'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { designTokens } from '@/lib/design-tokens';

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

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  className?: string;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
}

export function ChatInterface({
  messages,
  onSendMessage,
  isLoading = false,
  className = '',
  placeholder = 'Ask me anything about your travel plans...',
  maxLength = 2000,
  disabled = false,
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { isDark } = useTheme();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || disabled) return;

    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(timestamp);
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    const isAssistant = message.role === 'assistant';
    const isSystem = message.role === 'system';

    if (isSystem) {
  return (
        <div
          key={message.id}
          className="flex justify-center my-4"
          role="status"
          aria-live="polite"
        >
          <div className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-4 py-2 rounded-full text-sm">
            {message.content}
              </div>
            </div>
      );
    }

    return (
              <div
                key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
        role="article"
        aria-label={`${isUser ? 'Your' : 'Assistant'} message`}
      >
        <div
          className={`
            chat-message max-w-[80%] relative
            ${isUser 
              ? 'chat-message-user bg-primary-500 text-white' 
              : 'chat-message-assistant bg-neutral-100 dark:bg-neutral-800 text-text-primary'
            }
          `}
        >
          {/* Message content */}
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap break-words m-0">
              {message.content}
                  </p>
                </div>

          {/* Timestamp */}
          <div
            className={`
              text-xs mt-2 opacity-70
              ${isUser ? 'text-white' : 'text-neutral-500 dark:text-neutral-400'}
            `}
          >
            {formatTimestamp(message.timestamp)}
          </div>

          {/* Agent actions indicator */}
          {isAssistant && message.metadata?.actions && (
            <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
              <div className="flex flex-wrap gap-1">
                {message.metadata.actions.map((action, index) => (
                  <span
                    key={index}
                    className={`
                      inline-flex items-center px-2 py-1 rounded-full text-xs
                      ${action.success 
                        ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200' 
                        : 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200'
                      }
                    `}
                    title={action.error || `${action.tool} executed successfully`}
                  >
                    {action.success ? '✓' : '✗'} {action.tool}
                  </span>
                ))}
              </div>
            </div>
                )}
              </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages container */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-2"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-neutral-500 dark:text-neutral-400">
              <div className="w-16 h-16 mx-auto mb-4 opacity-50">
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
              <p className="text-sm">
                Ask me anything about travel planning, destinations, or itineraries.
              </p>
            </div>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        
        {/* Loading indicator */}
          {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="chat-message chat-message-assistant">
                <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span className="text-sm text-neutral-500">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-neutral-200 dark:border-neutral-700 p-4"
        role="form"
        aria-label="Send message"
      >
        <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder={placeholder}
              maxLength={maxLength}
              disabled={disabled || isLoading}
              rows={1}
              className={`
                input resize-none min-h-[2.5rem] max-h-32
                ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                focus:ring-2 focus:ring-primary-500 focus:border-transparent
              `}
              style={{
                height: 'auto',
                minHeight: '2.5rem',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
              }}
              aria-label="Message input"
              aria-describedby="input-help"
            />
            
            {/* Character count */}
            {maxLength && (
              <div
                id="input-help"
                className={`
                  absolute bottom-1 right-2 text-xs
                  ${inputValue.length > maxLength * 0.9 
                    ? 'text-error-500' 
                    : 'text-neutral-400 dark:text-neutral-500'
                  }
                `}
              >
                {inputValue.length}/{maxLength}
            </div>
            )}
            </div>
          
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading || disabled}
            className={`
              btn btn-primary px-4 py-2 min-w-[2.5rem] h-10
              ${!inputValue.trim() || isLoading || disabled 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-primary-600 active:bg-primary-700'
              }
              transition-all duration-200
            `}
            aria-label="Send message"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
          </div>
        
        {/* Input hints */}
        <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          Press Enter to send, Shift+Enter for new line
        </div>
      </form>
    </div>
  );
}

export default ChatInterface;