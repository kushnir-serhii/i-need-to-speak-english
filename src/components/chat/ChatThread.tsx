'use client';

import { useRef, useEffect } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { EmptyState } from './EmptyState';
import { MessageBubble } from './MessageBubble';
import { StreakChip } from './StreakChip';
import { TypingIndicator } from './TypingIndicator';

const STREAK_THRESHOLD = 3;

interface ChatThreadProps {
  repeat: (id: string, text: string) => void;
  ttsSpeed: number;
  onSpeedChange: (speed: number) => void;
  voices: SpeechSynthesisVoice[];
  onVoiceChange: (uri: string) => void;
  onPrompt?: (text: string) => void;
  /** Seed the composer from a correction card's "Say it back". */
  onSayItBack?: (text: string) => void;
}

export function ChatThread({
  repeat,
  ttsSpeed,
  onSpeedChange,
  voices,
  onVoiceChange,
  onPrompt,
  onSayItBack,
}: ChatThreadProps) {
  const messages = useChatStore((state) => state.messages);
  const deleteMessage = useChatStore((state) => state.deleteMessage);
  const speakingMessageId = useChatStore((s) => s.speakingMessageId);
  const cleanStreak = useChatStore((s) => s.cleanStreak);
  const lastAssistantId = [...messages].reverse().find((m) => m.role === 'assistant' && m.content)?.id;
  const ttsEnabled = useSettingsStore((state) => state.ttsEnabled);
  const selectedVoiceURI = useSettingsStore((state) => state.selectedVoiceURI);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on every new message or streaming chunk
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="custom-scrollbar mx-auto flex min-h-0 w-full max-w-[680px] flex-1 flex-col gap-4 overflow-y-auto px-4 py-5">
      {messages.length === 0 ? (
        <EmptyState onPrompt={onPrompt} />
      ) : (
        messages.map((message) => {
          if (message.role === 'assistant' && message.content === '') {
            return message.isStreaming ? <TypingIndicator key={message.id} /> : null;
          }
          return (
            <MessageBubble
              key={message.id}
              message={message}
              role={message.role}
              isSpeaking={speakingMessageId === message.id}
              pleased={
                message.role === 'assistant' &&
                message.id === lastAssistantId &&
                cleanStreak >= STREAK_THRESHOLD
              }
              onDelete={() => deleteMessage(message.id)}
              ttsEnabled={ttsEnabled}
              onRepeat={() => repeat(message.id, message.content)}
              onSpeak={(text) => repeat(message.id, text)}
              onSayItBack={onSayItBack}
              ttsSpeed={ttsSpeed}
              onSpeedChange={onSpeedChange}
              voices={voices}
              selectedVoiceURI={selectedVoiceURI}
              onVoiceChange={onVoiceChange}
            />
          );
        })
      )}
      {messages.length > 0 && cleanStreak >= STREAK_THRESHOLD && (
        <StreakChip count={cleanStreak} />
      )}
      <div ref={bottomRef} />
    </div>
  );
}
