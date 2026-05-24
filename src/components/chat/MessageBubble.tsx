'use client';

import type { Message } from '@/store/useChatStore';
import { MessageMenu } from './MessageMenu';

interface MessageBubbleProps {
  message: Message;
  role: Message['role'];
  isSpeaking?: boolean;
  onDelete: () => void;
  ttsEnabled?: boolean;
  onRepeat?: () => void;
  ttsSpeed?: number;
  onSpeedChange?: (speed: number) => void;
}

export function MessageBubble({ message, role, isSpeaking = false, onDelete, ttsEnabled = false, onRepeat, ttsSpeed = 1, onSpeedChange = () => {} }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="relative max-w-[75%] ml-auto bg-[#2F81F7] text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm whitespace-pre-wrap wrap-break-word">
        <MessageMenu content={message.content} onDelete={onDelete} side="left" role="user" ttsEnabled={ttsEnabled} onRepeat={onRepeat ?? (() => {})} ttsSpeed={ttsSpeed} onSpeedChange={onSpeedChange} />
        {message.content}
      </div>
    );
  }

  const borderClass = isSpeaking ? 'border-[#2F81F7]' : 'border-[#30363D]';

  return (
    <div className={`relative max-w-[75%] mr-auto bg-[#161B22] text-white rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm border ${borderClass} whitespace-pre-wrap wrap-break-word`}>
      <MessageMenu content={message.content} onDelete={onDelete} role="assistant" ttsEnabled={ttsEnabled} onRepeat={onRepeat ?? (() => {})} ttsSpeed={ttsSpeed} onSpeedChange={onSpeedChange} />
      {message.content}
      {isSpeaking && (
        <span className="absolute bottom-2 right-2 text-[#2F81F7] animate-pulse" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        </span>
      )}
    </div>
  );
}
