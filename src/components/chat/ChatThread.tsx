'use client';

import { useRef, useEffect } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { EmptyState } from './EmptyState';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

export function ChatThread() {
  const messages = useChatStore((state) => state.messages);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on every new message or streaming chunk
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-3">
      {messages.length === 0 ? (
        <EmptyState />
      ) : (
        messages.map((message) => {
          if (message.role === 'assistant' && message.isStreaming && message.content === '') {
            return <TypingIndicator key={message.id} />;
          }
          return <MessageBubble key={message.id} message={message} />;
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
}
