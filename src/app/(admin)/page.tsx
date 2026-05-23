'use client';

import { useState } from 'react';
import { ChatThread } from '@/components/chat/ChatThread';
import { ChatStatusBar } from '@/components/chat/ChatStatusBar';
import { ChatInput } from '@/components/chat/ChatInput';
import { LimitReachedModal } from '@/components/ui';
import { useUserStore } from '@/store/useUserStore';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function ChatPage() {
  const dailyRequests = useUserStore((s) => s.dailyRequests);
  const dailyRequestLimit = useUserStore((s) => s.dailyRequestLimit);
  const apiKey = useSettingsStore((s) => s.apiKey);

  const isLimitReached = apiKey === '' && dailyRequests >= dailyRequestLimit;

  const [showLimitModal, setShowLimitModal] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <ChatThread />
      <div className="flex-none">
        <ChatStatusBar />
      </div>
      <ChatInput
        disabled={isLimitReached}
        onLimitReached={() => setShowLimitModal(true)}
      />
      <LimitReachedModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
      />
    </div>
  );
}
