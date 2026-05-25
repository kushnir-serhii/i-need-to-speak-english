'use client';

import { useState, useCallback, useEffect } from 'react';
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
  const ttsSpeed = useSettingsStore((s) => s.ttsSpeed);
  const setTtsSpeed = useSettingsStore((s) => s.setTtsSpeed);
  const setSelectedVoiceURI = useSettingsStore((s) => s.setSelectedVoiceURI);

  const handleSpeedChange = useCallback((speed: number) => {
    setTtsSpeed(speed);
  }, [setTtsSpeed]);

  const handleVoiceChange = useCallback((uri: string) => {
    setSelectedVoiceURI(uri);
  }, []);

  const { isSupported, voices, speak, stop, repeat } = useTTS({ targetLanguage });

  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const msUntilMidnight = tomorrow.getTime() - Date.now();

    const timerId = setTimeout(() => {
      const visitorId = useUserStore.getState().visitorId;
      if (visitorId === null) return;
      fetch(`/api/stats?visitorId=${visitorId}`)
        .then((res) => res.json())
        .then((data: { count: number; cap: number; dailyRequests: number; dailyRequestLimit: number }) => {
          useUserStore.getState().updateStats(
            data.count,
            data.cap,
            data.dailyRequests,
            data.dailyRequestLimit,
          );
        })
        .catch(() => {
          // Fail silently — the user will see updated limits on their next request
        });
    }, msUntilMidnight);

    return () => clearTimeout(timerId);
  }, []);

  const isLimitReached = apiKey === '' && dailyRequests >= dailyRequestLimit;

  const [showLimitModal, setShowLimitModal] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <ChatThread repeat={repeat} ttsSpeed={ttsSpeed} onSpeedChange={handleSpeedChange} voices={voices} onVoiceChange={handleVoiceChange} />
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
