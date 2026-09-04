'use client';

import { PiCheckCircleBold } from 'react-icons/pi';

interface StreakChipProps {
  count: number;
}

/** "N clean sentences in a row" — a small win surfaced in the thread (design 1a). */
export function StreakChip({ count }: StreakChipProps) {
  return (
    <div className="flex items-center gap-2 self-start rounded-full border border-neutral-800 px-2.5 py-1.5">
      <PiCheckCircleBold className="text-[15px] text-accent-300" aria-hidden />
      <span className="text-[13px] text-neutral-300">
        {count} clean {count === 1 ? 'sentence' : 'sentences'} in a row
      </span>
    </div>
  );
}
