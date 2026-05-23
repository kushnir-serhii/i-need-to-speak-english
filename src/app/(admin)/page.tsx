'use client';

import { ChatThread } from '@/components/chat/ChatThread';
import { ChatInput } from '@/components/chat/ChatInput';

export default function ChatPage() {
  return (
    <div className="flex flex-col h-full">
      <ChatThread />
      <ChatInput />
    </div>
  );
}
