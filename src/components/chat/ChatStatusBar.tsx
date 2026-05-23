'use client';

import { useSettingsStore } from '@/store/useSettingsStore';
import { useUserStore } from '@/store/useUserStore';
import { useChatStore } from '@/store/useChatStore';

export function ChatStatusBar() {
  const apiKey = useSettingsStore((s) => s.apiKey);
  const dailyRequests = useUserStore((s) => s.dailyRequests);
  const dailyRequestLimit = useUserStore((s) => s.dailyRequestLimit);
  const sessionTokens = useChatStore((s) => s.sessionTokens);

  const isYourKey = apiKey !== '';
  const messagesLeft = dailyRequestLimit - dailyRequests;

  return (
    <div
      className="flex flex-row items-center justify-between border-t border-[#30363D] px-4 py-2 text-sm"
      style={{ color: '#8B949E' }}
    >
      <span>{isYourKey ? 'Using your key' : 'Free mode'}</span>
      {isYourKey ? (
        <span className="font-mono">{sessionTokens} tokens used</span>
      ) : (
        <span className="font-mono">{messagesLeft} messages left today</span>
      )}
    </div>
  );
}
