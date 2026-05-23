'use client';

import type { Message } from '@/store/useChatStore';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="max-w-[75%] ml-auto bg-[#2F81F7] text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm whitespace-pre-wrap break-words">
        {message.content}
      </div>
    );
  }

  return (
    <div className="max-w-[75%] mr-auto bg-[#161B22] text-white rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm border border-[#30363D] whitespace-pre-wrap break-words">
      {message.content}
    </div>
  );
}
