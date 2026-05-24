'use client';

import { useRef, useEffect } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { EmptyState } from './EmptyState';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

interface ChatThreadProps {
  repeat: (id: string, text: string) => void;
}

export function ChatThread({ repeat }: ChatThreadProps) {
  const messages = useChatStore((state) => state.messages);
  const deleteMessage = useChatStore((state) => state.deleteMessage);
  const speakingMessageId = useChatStore((s) => s.speakingMessageId);
  const ttsEnabled = useSettingsStore((state) => state.ttsEnabled);
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
          return (
            <MessageBubble
              key={message.id}
              message={message}
              role={message.role}
              isSpeaking={speakingMessageId === message.id}
              onDelete={() => deleteMessage(message.id)}
              ttsEnabled={ttsEnabled}
              onRepeat={() => repeat(message.id, message.content)}
            />
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
}
