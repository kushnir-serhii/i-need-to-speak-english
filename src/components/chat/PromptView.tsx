'use client';

import Link from 'next/link';
import { PiArrowUpRightBold } from 'react-icons/pi';
import { useSettingsStore } from '@/store/useSettingsStore';

const DEFAULT_PROMPT =
  'Act as a patient conversation partner. Keep the conversation going with one question at a time, and gently correct my English once per answer.';

/**
 * The "Prompt" tab of the coached session — the instruction the assistant
 * is running under, read-only here and editable in settings (design doc 1c).
 */
export function PromptView() {
  const useCustomPrompt = useSettingsStore((s) => s.useCustomPrompt);
  const customPrompt = useSettingsStore((s) => s.customPrompt);
  const targetLanguage = useSettingsStore((s) => s.targetLanguage);
  const level = useSettingsStore((s) => s.level);

  const active = useCustomPrompt && customPrompt.trim() ? customPrompt : DEFAULT_PROMPT;

  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-1 flex-col gap-4 px-4 py-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] tracking-[0.1em] text-neutral-600 uppercase">
          Running prompt
        </span>
        <span className="text-[13px] text-neutral-500">
          {useCustomPrompt && customPrompt.trim() ? 'Custom' : 'Default'} · {targetLanguage} · {level}
        </span>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-surface p-4 text-sm leading-relaxed text-neutral-300">
        {active}
      </div>

      <Link
        href="/settings"
        className="flex h-[34px] items-center gap-1.5 self-start rounded-lg border border-neutral-800 px-3 text-[13px] text-neutral-300 transition-colors hover:border-accent-700 hover:text-accent-200"
      >
        Edit in settings
        <PiArrowUpRightBold className="text-[13px]" aria-hidden />
      </Link>
    </div>
  );
}
