'use client';

import { useSettingsStore } from '@/store/useSettingsStore';
import { useUserStore } from '@/store/useUserStore';

/**
 * Thin usage line under the chat header (design doc 1a) — an accent
 * progress bar showing how much of today's free allowance is spent.
 * Hidden entirely when the visitor is on their own API key.
 */
export function ChatStatusBar() {
  const apiKey = useSettingsStore((s) => s.apiKey);
  const dailyRequests = useUserStore((s) => s.dailyRequests);
  const dailyRequestLimit = useUserStore((s) => s.dailyRequestLimit);

  if (apiKey !== '' || dailyRequestLimit <= 0) return null;

  const pct = Math.min(100, Math.round((dailyRequests / dailyRequestLimit) * 100));

  return (
    <div className="mx-4 h-0.5 overflow-hidden rounded-full bg-neutral-900">
      <div
        className="h-full bg-linear-to-r from-transparent to-accent transition-[width] duration-500"
        style={{ width: `${Math.max(6, 100 - pct)}%` }}
      />
    </div>
  );
}
