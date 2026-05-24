'use client';

import { useState } from 'react';
import { ChatThread } from '@/components/chat/ChatThread';
import { ChatStatusBar } from '@/components/chat/ChatStatusBar';
import { ChatInput } from '@/components/chat/ChatInput';
import { LimitReachedModal } from '@/components/ui';
import { useUserStore } from '@/store/useUserStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTTS } from '@/hooks/useTTS';

export default function ChatPage() {
  const dailyRequests = useUserStore((s) => s.dailyRequests);
  const dailyRequestLimit = useUserStore((s) => s.dailyRequestLimit);
  const apiKey = useSettingsStore((s) => s.apiKey);
  const targetLanguage = useSettingsStore((s) => s.targetLanguage);
  const ttsEnabled = useSettingsStore((s) => s.ttsEnabled);
  const setTtsEnabled = useSettingsStore((s) => s.setTtsEnabled);

  const { isSupported, speak, stop, repeat } = useTTS({ targetLanguage });

  const isLimitReached = apiKey === '' && dailyRequests >= dailyRequestLimit;

  const [showLimitModal, setShowLimitModal] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <ChatThread repeat={repeat} />
      <div className="flex-none">
        <ChatStatusBar />
      </div>
      <ChatInput
        disabled={isLimitReached}
        onLimitReached={() => setShowLimitModal(true)}
        speak={speak}
        stop={stop}
        isSupported={isSupported}
        ttsEnabled={ttsEnabled}
        onTTSToggle={() => {
          const next = !ttsEnabled;
          setTtsEnabled(next);
          if (!next) stop();
        }}
      />
      <LimitReachedModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
      />
    </div>
  );
}
