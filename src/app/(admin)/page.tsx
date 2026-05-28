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

  const [showNewConvDialog, setShowNewConvDialog] = useState(false);

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

  useEffect(() => {
    useChatStore.getState().initSessionId();
  }, []);

  const role = useUserStore((s) => s.role);
  const isLimitReached = role !== 'admin' && apiKey === '' && dailyRequests >= dailyRequestLimit;

  const [showLimitModal, setShowLimitModal] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none flex items-center justify-end px-4 py-2">
        <button
          type="button"
          disabled={messages.length === 0}
          onClick={handleNewConversation}
          className="px-3 py-1.5 rounded-lg text-sm font-medium border border-[#30363D] text-[#F0F6FC] hover:bg-[#21262D] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          New conversation
        </button>
      </div>
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
      {showNewConvDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={handleCancelNewConv}
        >
          <div
            className="bg-[#161B22] rounded-xl max-w-sm w-full mx-4 p-6 border border-[#30363D]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-[#8B949E] leading-relaxed mb-6">
              Save this conversation before starting a new one?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancelNewConv}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-[#30363D] text-[#F0F6FC] hover:bg-[#21262D] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-[#30363D] text-[#F0F6FC] hover:bg-[#21262D] transition-colors"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[#2F81F7] hover:bg-blue-500 text-white transition-colors"
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
