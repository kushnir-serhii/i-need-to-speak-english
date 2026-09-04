'use client';

import { useState } from 'react';
import {
  PiPencilSimpleBold,
  PiSpeakerHighBold,
  PiMicrophoneBold,
  PiQuestionBold,
} from 'react-icons/pi';

interface CorrectionCardProps {
  /** What the learner actually wrote. */
  original: string;
  /** The suggested rewrite. */
  suggestion: string;
  /** One-line reason, revealed by "Why". */
  note?: string;
  /** Speak the corrected phrase aloud. */
  onHear?: () => void;
  /** Drop the corrected phrase into the composer to say it back. */
  onSayItBack?: (text: string) => void;
}

const action =
  'flex h-[34px] items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-accent-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent';

/**
 * "One fix" — a single grammar correction surfaced as a card in the thread
 * so practice leaves a trace (design doc 1c).
 */
export function CorrectionCard({
  original,
  suggestion,
  note,
  onHear,
  onSayItBack,
}: CorrectionCardProps) {
  const [showWhy, setShowWhy] = useState(false);

  return (
    <div className="animate-message-in w-[300px] max-w-full self-end overflow-hidden rounded-xl border border-neutral-800 bg-surface">
      <div className="flex items-center gap-1.5 border-b border-neutral-900 px-3 py-2.5">
        <PiPencilSimpleBold className="text-sm text-accent-300" aria-hidden />
        <span className="text-xs tracking-[0.06em] text-neutral-400 uppercase">One fix</span>
        <span className="flex-1" />
        <span className="text-xs text-neutral-500">Grammar</span>
      </div>

      <div className="flex flex-col gap-1.5 px-3 py-2.5">
        <span className="text-sm leading-snug text-neutral-500 line-through">{original}</span>
        <span className="text-[15px] leading-snug text-accent-100">{suggestion}</span>
        {showWhy && note ? (
          <span className="mt-1 text-[13px] leading-snug text-neutral-400">{note}</span>
        ) : null}
      </div>

      <div className="flex gap-0.5 px-2 pb-2.5">
        <button type="button" className={action} onClick={onHear}>
          <PiSpeakerHighBold className="text-[15px]" aria-hidden />
          Hear
        </button>
        <button
          type="button"
          className={action}
          onClick={() => onSayItBack?.(suggestion)}
        >
          <PiMicrophoneBold className="text-[15px]" aria-hidden />
          Say it back
        </button>
        {note ? (
          <button
            type="button"
            className={action}
            aria-expanded={showWhy}
            onClick={() => setShowWhy((v) => !v)}
          >
            <PiQuestionBold className="text-[15px]" aria-hidden />
            Why
          </button>
        ) : null}
      </div>
    </div>
  );
}
