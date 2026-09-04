'use client';

import Link from 'next/link';
import { PiCaretDownBold } from 'react-icons/pi';
import { useSettingsStore, CEFR_LEVELS } from '@/store/useSettingsStore';
import { useUserStore } from '@/store/useUserStore';

interface SessionPanelProps {
  voiceName: string;
  ttsSpeed: number;
  /** Extra classes for the outer element (layout differs between rail and sheet). */
  className?: string;
}

/**
 * The session summary — language, level, voice, prompt, usage — shown as a
 * right rail on desktop (design doc 1d) and a slide-over sheet on mobile.
 */
export function SessionPanel({ voiceName, ttsSpeed, className = '' }: SessionPanelProps) {
  const targetLanguage = useSettingsStore((s) => s.targetLanguage);
  const level = useSettingsStore((s) => s.level);
  const setLevel = useSettingsStore((s) => s.setLevel);
  const useCustomPrompt = useSettingsStore((s) => s.useCustomPrompt);
  const customPrompt = useSettingsStore((s) => s.customPrompt);
  const apiKey = useSettingsStore((s) => s.apiKey);
  const dailyRequests = useUserStore((s) => s.dailyRequests);
  const dailyRequestLimit = useUserStore((s) => s.dailyRequestLimit);

  const usagePct =
    dailyRequestLimit > 0
      ? Math.min(100, Math.round((dailyRequests / dailyRequestLimit) * 100))
      : 0;

  return (
    <div className={`flex flex-col gap-5 ${className}`}>
      <span className="text-[11px] font-medium tracking-widest text-neutral-600 uppercase">
        Session
      </span>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] text-neutral-400">Practising</span>
        <Link
          href="/settings"
          className="flex items-center justify-between rounded-[10px] border border-neutral-800 px-3 py-2.5 text-sm text-ink transition-colors hover:border-accent-700"
        >
          {targetLanguage}
          <PiCaretDownBold className="text-[13px] text-neutral-500" />
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] text-neutral-400">Level</span>
        <div className="grid grid-cols-6 gap-1 rounded-[11px] bg-neutral-900 p-1">
          {CEFR_LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLevel(l)}
              aria-pressed={level === l}
              className={`grid h-8 place-items-center rounded-lg text-[13px] transition-colors ${
                level === l
                  ? 'border border-accent-800 bg-surface text-accent-100'
                  : 'text-neutral-400 hover:text-ink'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] text-neutral-400">Voice</span>
        <div className="flex items-center justify-between rounded-[10px] border border-neutral-800 px-3 py-2.5 text-sm text-ink">
          <span className="truncate">
            {voiceName} · {ttsSpeed.toFixed(1)}×
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] text-neutral-400">Prompt</span>
        <Link
          href="/settings"
          className="rounded-[10px] border border-neutral-800 bg-surface p-3 text-[13px] leading-relaxed text-neutral-300 transition-colors hover:border-accent-700"
        >
          {useCustomPrompt && customPrompt
            ? `Custom · “${customPrompt.slice(0, 60)}${customPrompt.length > 60 ? '…' : ''}”`
            : 'Default · a patient conversation partner who nudges your English.'}
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] text-neutral-400">Usage today</span>
        <div className="h-1.5 overflow-hidden rounded-full bg-neutral-900">
          <div className="h-full bg-accent-500" style={{ width: `${usagePct}%` }} />
        </div>
        <span className="text-xs tabular-nums text-neutral-500">
          {dailyRequests} of {dailyRequestLimit} messages · {apiKey ? 'your key' : 'free key'}
        </span>
      </div>

      <span className="flex-1" />

      <Link
        href="/settings"
        className="grid h-10 place-items-center rounded-[10px] border border-accent text-sm text-accent-200 transition-colors hover:bg-accent/[0.14]"
      >
        {apiKey ? 'Manage your API key' : 'Use my own API key'}
      </Link>
    </div>
  );
}
