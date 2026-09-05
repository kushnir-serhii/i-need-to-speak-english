'use client';

import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui';
import { useUserStore } from '@/store/useUserStore';
import { useSettingsStore } from '@/store/useSettingsStore';

export const Header: React.FC = () => {
  const router = useRouter();
  const visitorName = useSettingsStore((state) => state.visitorName);
  const apiKey = useSettingsStore((state) => state.apiKey);
  const role = useUserStore((state) => state.role);
  const visitorCount = useUserStore((state) => state.visitorCount);
  const dailyCap = useUserStore((state) => state.dailyCap);
  const dailyRequests = useUserStore((state) => state.dailyRequests);
  const dailyRequestLimit = useUserStore((state) => state.dailyRequestLimit);

  async function handleSignOut(): Promise<void> {
    if (role === 'admin') {
      await fetch('/api/admin/logout', { method: 'POST' });
    }
    useUserStore.getState().reset();
    useSettingsStore.getState().setVisitorName(null);
    router.push('/login');
  }

  const remainingMessages = Math.max(0, dailyRequestLimit - dailyRequests);

  return (
    <header className="sticky top-0 z-30 flex w-full items-center gap-3 px-4 py-3 md:pl-0">
      {/* Mark — mobile only; the sidebar carries it on desktop */}
      <div className="md:hidden">
        <Logo />
      </div>

      <div className="ml-auto flex min-w-0 items-center gap-3 font-mono text-xs text-neutral-500 sm:text-sm">
        {apiKey === '' && (
          <span className="hidden whitespace-nowrap sm:inline">
            {remainingMessages} left today
          </span>
        )}
        <span className="hidden whitespace-nowrap md:inline">
          {visitorCount} / {dailyCap} visitors
        </span>
        {visitorName && (
          <span className="max-w-32 truncate font-sans text-accent-400">{visitorName}</span>
        )}
        <button
          onClick={() => void handleSignOut()}
          className="whitespace-nowrap font-sans text-neutral-400 transition-colors hover:text-accent-200"
        >
          Log out
        </button>
      </div>
    </header>
  );
};
