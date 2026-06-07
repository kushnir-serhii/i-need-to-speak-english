'use client';

import { useState, useCallback, useEffect } from 'react';
import { ChatThread } from '@/components/chat/ChatThread';
import { ChatStatusBar } from '@/components/chat/ChatStatusBar';
import { ChatInput } from '@/components/chat/ChatInput';
import { LimitReachedModal } from '@/components/ui';
import { useUserStore } from '@/store/useUserStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useChatStore } from '@/store/useChatStore';
import { useTTS } from '@/hooks/useTTS';
import { useNotificationStore } from '@/store/useNotificationStore';

export default function ChatPage() {
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showNewConvDialog, setShowNewConvDialog] = useState(false);

  const dailyRequests = useUserStore((s) => s.dailyRequests);
  const dailyRequestLimit = useUserStore((s) => s.dailyRequestLimit);
  const visitorId = useUserStore((s) => s.visitorId);
  const apiKey = useSettingsStore((s) => s.apiKey);
  const targetLanguage = useSettingsStore((s) => s.targetLanguage);
  const ttsEnabled = useSettingsStore((s) => s.ttsEnabled);
  const setTtsEnabled = useSettingsStore((s) => s.setTtsEnabled);
  const ttsSpeed = useSettingsStore((s) => s.ttsSpeed);
  const setTtsSpeed = useSettingsStore((s) => s.setTtsSpeed);
  const setSelectedVoiceURI = useSettingsStore((s) => s.setSelectedVoiceURI);

  const messages = useChatStore((s) => s.messages);
  const sessionId = useChatStore((s) => s.sessionId);
  const clearMessages = useChatStore((s) => s.clearMessages);
  const setSessionSaved = useChatStore((s) => s.setSessionSaved);

  const addToast = useNotificationStore((s) => s.addToast);

  const handleNewConversation = useCallback(() => {
    if (messages.length === 0) return;
    setShowNewConvDialog(true);
  }, [messages.length]);

  const handleSave = useCallback(async () => {
    try {
      const payload = {
        sessionId,
        visitorId,
        messages: messages.map(({ role, content, timestamp }) => ({ role, content, timestamp })),
      };
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSessionSaved(true);
      clearMessages();
      setShowNewConvDialog(false);
    } catch {
      addToast('error', 'Could not save the conversation. Please try again.');
    }
  }, [sessionId, visitorId, messages, setSessionSaved, clearMessages, addToast]);

  const handleDiscard = useCallback(() => {
    clearMessages();
    setShowNewConvDialog(false);
  }, [clearMessages]);

  const handleCancelNewConv = useCallback(() => {
    setShowNewConvDialog(false);
  }, []);

  const handleSpeedChange = useCallback(
    (speed: number) => {
      setTtsSpeed(speed);
    },
    [setTtsSpeed],
  );

  const handleVoiceChange = useCallback((uri: string) => {
    setSelectedVoiceURI(uri);
  }, []);

  const { isSupported, voices, speak, stop, repeat } = useTTS({ targetLanguage });

  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
    );
    const msUntilMidnight = tomorrow.getTime() - Date.now();

    const timerId = setTimeout(() => {
      const visitorId = useUserStore.getState().visitorId;
      if (visitorId === null) return;
      fetch(`/api/stats?visitorId=${visitorId}`)
        .then((res) => res.json())
        .then(
          (data: {
            count: number;
            cap: number;
            dailyRequests: number;
            dailyRequestLimit: number;
          }) => {
            useUserStore
              .getState()
              .updateStats(data.count, data.cap, data.dailyRequests, data.dailyRequestLimit);
          },
        )
        .catch(() => {
          // Fail silently — the user will see updated limits on their next request
        });
    }, msUntilMidnight);

    return () => clearTimeout(timerId);
  }, []);

  useEffect(() => {
    useChatStore.getState().initSessionId();
  }, []);

  const role = useUserStore((s) => s.role);
  const isLimitReached = role === 'user' && dailyRequests > 0 && dailyRequests >= dailyRequestLimit;
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-none items-center justify-end px-4 py-2">
        <button
          type="button"
          disabled={messages.length === 0}
          onClick={handleNewConversation}
          className="rounded-lg border border-[#30363D] px-3 py-1.5 text-sm font-medium text-[#F0F6FC] transition-colors hover:bg-[#21262D] disabled:cursor-not-allowed disabled:opacity-40"
        >
          New conversation
        </button>
      </div>
      <ChatThread
        repeat={repeat}
        ttsSpeed={ttsSpeed}
        onSpeedChange={handleSpeedChange}
        voices={voices}
        onVoiceChange={handleVoiceChange}
      />
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
      <LimitReachedModal isOpen={showLimitModal} onClose={() => setShowLimitModal(false)} />
      {showNewConvDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={handleCancelNewConv}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-xl border border-[#30363D] bg-[#161B22] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-6 text-sm leading-relaxed text-[#8B949E]">
              Save this conversation before starting a new one?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelNewConv}
                className="rounded-lg border border-[#30363D] px-4 py-2 text-sm font-medium text-[#F0F6FC] transition-colors hover:bg-[#21262D]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                className="rounded-lg border border-[#30363D] px-4 py-2 text-sm font-medium text-[#F0F6FC] transition-colors hover:bg-[#21262D]"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-lg bg-[#2F81F7] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
