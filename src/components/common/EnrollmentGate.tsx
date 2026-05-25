'use client';

import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import NamePrompt from '@/components/ui/NamePrompt';

// Internal component — not exported
function DailyLimitScreen({ count, cap }: { count: number; cap: number }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0D1117] px-4">
      {/* INTSE text mark */}
      <div className="rounded-full bg-white p-[13px]">
        <span className="flex size-6 items-center justify-center text-xs font-bold text-black">
          INTSE
        </span>
      </div>

      <h1 className="max-w-md text-center font-[--font-inter] text-2xl font-bold text-[#F0F6FC]">
        We&apos;ve reached our daily visitor limit. Come back tomorrow!
      </h1>

      <p className="font-mono text-sm text-[#8B949E]">
        {count} / {cap} visitors today
      </p>
    </div>
  );
}

type Status = 'loading' | 'enrolled' | 'capped';

interface CappedData {
  count: number;
  cap: number;
}

export default function EnrollmentGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [cappedData, setCappedData] = useState<CappedData>({ count: 0, cap: 0 });
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const visitorId = useUserStore.getState().visitorId;

    if (visitorId !== null) {
      // Returning visitor — fetch updated stats
      fetch(`/api/stats?visitorId=${visitorId}`)
        .then((res) => res.json())
        .then((data: { count: number; cap: number; dailyRequests: number; dailyRequestLimit: number }) => {
          useUserStore.getState().updateStats(
            data.count,
            data.cap,
            data.dailyRequests,
            data.dailyRequestLimit,
          );
          setStatus('enrolled');
        })
        .catch(() => {
          // Fail open — don't block the user for a network error
          setStatus('enrolled');
        });
    } else {
      // New visitor — attempt enrollment
      fetch('/api/enroll', { method: 'POST' })
        .then((res) => res.json())
        .then((data: { enrolled: boolean; visitorId?: string; count: number; cap: number }) => {
          if (data.enrolled && data.visitorId) {
            useUserStore.getState().enroll(data.visitorId, data.count, data.cap);
            if (!useSettingsStore.getState().hasSeenNamePrompt) {
              setShowPrompt(true);
            }
            setStatus('enrolled');
          } else {
            setCappedData({ count: data.count, cap: data.cap });
            setStatus('capped');
          }
        })
        .catch(() => {
          // Fail open — don't block the user for a network error
          setStatus('enrolled');
        });
    }
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D1117]">
        <div className="size-10 animate-spin rounded-full border-4 border-[#8B949E] border-t-[#2F81F7]" />
      </div>
    );
  }

  if (status === 'capped') {
    return <DailyLimitScreen count={cappedData.count} cap={cappedData.cap} />;
  }

  if (showPrompt) {
    return <NamePrompt onDone={() => setShowPrompt(false)} />;
  }

  return <>{children}</>;
}
