'use client';

import { useSettingsStore } from '@/store/useSettingsStore';
import { useUserStore } from '@/store/useUserStore';
import { useChatStore } from '@/store/useChatStore';

export function UsageIndicator(): React.ReactElement {
  const apiKey = useSettingsStore((s) => s.apiKey);
  const dailyRequests = useUserStore((s) => s.dailyRequests);
  const dailyRequestLimit = useUserStore((s) => s.dailyRequestLimit);
  const sessionTokens = useChatStore((s) => s.sessionTokens);

  const isByoKey = apiKey !== '';

  return (
    <section className="rounded-lg border border-[#30363D] bg-[#161B22] p-6">
      <h2 className="mb-1 text-base font-semibold text-[#F0F6FC]">Usage</h2>
      <p className="text-sm text-[#8B949E]">
        {isByoKey
          ? `${sessionTokens.toLocaleString('en-US')} tokens used`
          : `${dailyRequests} / ${dailyRequestLimit} messages today`}
      </p>
    </section>
  );
}
