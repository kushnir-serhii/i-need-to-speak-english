'use client';

import { PiMicrophoneFill, PiArrowUpRightBold } from 'react-icons/pi';
import { IntseMark } from '@/components/ui';
import { useChatStore } from '@/store/useChatStore';

interface TalkPanelProps {
  /** Switch back to the reading view. */
  onOpenThread: () => void;
}

/**
 * The talk surface (design doc 1b, as a tab of the coached session): a
 * single large target with the last exchange underneath. Hands-free
 * auto-dialog drives the mic in the composer below.
 */
export function TalkPanel({ onOpenThread }: TalkPanelProps) {
  const messages = useChatStore((s) => s.messages);
  const autoDialogActive = useChatStore((s) => s.autoDialogActive);
  const setAutoDialogActive = useChatStore((s) => s.setAutoDialogActive);

  const lastAssistant = [...messages]
    .reverse()
    .find((m) => m.role === 'assistant' && m.content)?.content;

  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-1 flex-col items-center justify-center gap-7 px-7 py-6">
      <div className="relative grid h-52 w-52 place-items-center">
        {autoDialogActive && (
          <>
            <span className="animate-pulse-ring absolute inset-0 rounded-full border border-accent-700" />
            <span
              className="animate-pulse-ring absolute inset-6 rounded-full border border-accent-800"
              style={{ animationDelay: '0.9s' }}
            />
          </>
        )}
        <span className="absolute inset-9 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-accent)_22%,transparent),transparent_70%)]" />
        <span className="relative text-accent-200">
          <IntseMark size={92} state={autoDialogActive ? 'listening' : 'idle'} />
        </span>
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <span className="font-heading text-2xl font-medium text-ink">
          {autoDialogActive ? 'Listening…' : 'Ready when you are'}
        </span>
        <span className="text-sm text-neutral-400">
          {autoDialogActive
            ? 'Speak, and I answer back. Tap to pause.'
            : 'Tap to start a hands-free conversation.'}
        </span>
      </div>

      <button
        type="button"
        aria-pressed={autoDialogActive}
        onClick={() => setAutoDialogActive(!autoDialogActive)}
        className={`grid h-24 w-24 place-items-center rounded-full border border-accent text-[40px] text-accent-100 shadow-[0_0_0_10px_color-mix(in_srgb,var(--color-accent)_6%,transparent)] transition-colors hover:bg-accent/20 ${
          autoDialogActive ? 'animate-pulse bg-accent/20' : 'bg-accent/12'
        }`}
      >
        <PiMicrophoneFill />
      </button>

      {lastAssistant && (
        <div className="flex w-full flex-col gap-2 pt-1">
          <span className="text-[11px] tracking-widest text-neutral-600 uppercase">
            Last exchange
          </span>
          <span className="line-clamp-3 text-sm leading-relaxed text-neutral-300">
            &ldquo;{lastAssistant}&rdquo;
          </span>
          <button
            type="button"
            onClick={onOpenThread}
            className="mt-0.5 flex h-[34px] items-center gap-1.5 self-start rounded-lg border border-neutral-800 px-3 text-[13px] text-neutral-300 transition-colors hover:border-accent-700 hover:text-accent-200"
          >
            Full transcript
            <PiArrowUpRightBold className="text-[13px]" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
