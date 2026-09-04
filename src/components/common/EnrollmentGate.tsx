'use client';

import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import NamePrompt from '@/components/ui/NamePrompt';

// Internal component — not exported
function DailyLimitScreen({ count, cap }: { count: number; cap: number }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-4">
      {/* INTSE text mark */}
      <div className="rounded-full bg-white p-[13px]">
        <span className="flex size-6 items-center justify-center text-xs font-bold text-black">
          INTSE
        </span>
      </div>

      <h1 className="max-w-md text-center font-[--font-inter] text-2xl font-bold text-ink">
        We&apos;ve reached our daily visitor limit. Come back tomorrow!
      </h1>

      <p className="font-mono text-sm text-neutral-500">
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
    async function checkAccess() {
      // Step 1: check for an active owner session (JWT cookie)
      try {
        const meRes = await fetch('/api/admin/me');
        if (meRes.ok) {
          const meData = await meRes.json() as { role: string; sub: string };
          useUserStore.getState().setRoleFromApi(meData.role);
          // Named users use their username as visitorId (no anonymous cookie)
          if (meData.sub) {
            useUserStore.getState().setVisitorId(meData.sub);
          }
          setStatus('enrolled');
          return;
        }
      } catch {
        // Network error — fall through to visitor enrollment
      }

      // Step 2: normal visitor enrollment
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
            useUserStore.getState().setRole('user');
            setStatus('enrolled');
          })
          .catch(() => {
            useUserStore.getState().setRole('user');
            setStatus('enrolled');
          });
      } else {
        // New visitor — attempt enrollment
        fetch('/api/enroll', { method: 'POST' })
          .then((res) => res.json())
          .then((data: { enrolled: boolean; visitorId?: string; count: number; cap: number }) => {
            if (data.enrolled && data.visitorId) {
              useUserStore.getState().enroll(data.visitorId, data.count, data.cap);
              useUserStore.getState().setRole('user');
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
            useUserStore.getState().setRole('user');
            setStatus('enrolled');
          });
      }
    }

    void checkAccess();
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="size-10 animate-spin rounded-full border-4 border-[#9397ab] border-t-[#9184d9]" />
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
