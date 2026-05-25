'use client';

import { Logo, InputSearch } from '@/components/ui';
import { useUserStore } from '@/store/useUserStore';
import { useSettingsStore } from '@/store/useSettingsStore';

export const Header: React.FC = () => {
  const visitorName = useSettingsStore((state) => state.visitorName);
  const apiKey = useSettingsStore((state) => state.apiKey);
  const reset = useUserStore((state) => state.reset);
  const visitorCount = useUserStore((state) => state.visitorCount);
  const dailyCap = useUserStore((state) => state.dailyCap);
  const dailyRequests = useUserStore((state) => state.dailyRequests);
  const dailyRequestLimit = useUserStore((state) => state.dailyRequestLimit);

  const remainingMessages = Math.max(0, dailyRequestLimit - dailyRequests);

  return (
    <header className="flex w-full">
      <div className="flex w-full flex-col items-start justify-between gap-3 py-3.5 pr-4 pl-4 sm:flex-row sm:items-center md:gap-0 md:pl-0 lg:flex-row">
        <div className="flex w-full justify-between">
          {/* <!-- Logo mobile --> */}
          <div className="md:hidden">
            <Logo />
          </div>
          {/* <!-- Search --> */}
          <div className="mr-auto ml-2 hidden sm:block">
            <InputSearch />
          </div>

          {/* <!-- User Area --> */}
          <div className="flex items-center gap-3">
            {apiKey === '' && (
              <span
                style={{ fontFamily: 'var(--font-mono)' }}
                className="text-sm text-[#8B949E]"
              >
                {remainingMessages} messages left today
              </span>
            )}
            <span
              style={{ fontFamily: 'var(--font-mono)' }}
              className="text-sm text-[#8B949E]"
            >
              {visitorCount} / {dailyCap} visitors today
            </span>
            {visitorName && (
              <span className="text-sm text-muted-foreground">{visitorName}</span>
            )}
            <button
              onClick={reset}
              className="text-sm text-foreground hover:text-primary transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
        <div className="sm:hidden">
          <InputSearch />
        </div>
      </div>
    </header>
  );
};
