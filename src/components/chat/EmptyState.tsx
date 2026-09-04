'use client';

import { IntseMark } from '@/components/ui';

const PROMPTS = ['Ask me a question', 'Say it slower', 'Explain that'];

interface EmptyStateProps {
  onPrompt?: (text: string) => void;
}

export function EmptyState({ onPrompt }: EmptyStateProps) {
  return (
    <div className="animate-fade-in flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="relative grid h-[132px] w-[132px] place-items-center">
        <span className="animate-pulse-ring absolute inset-0 rounded-full border border-accent-700" />
        <span
          className="animate-pulse-ring absolute inset-4 rounded-full border border-accent-800"
          style={{ animationDelay: '0.9s' }}
        />
        <span className="absolute inset-6 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-accent)_20%,transparent),transparent_70%)]" />
        <span className="relative text-accent-300">
          <IntseMark size={56} />
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <h2 className="font-heading text-xl font-medium text-ink">Ready when you are</h2>
        <p className="max-w-[280px] text-sm leading-relaxed text-neutral-400">
          Type below, or hold the mic and just talk. I&rsquo;ll keep the conversation going and
          nudge your English as we go.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPrompt?.(p)}
            className="rounded-full border border-neutral-800 px-3 py-1.5 text-[13px] text-neutral-300 transition-colors hover:border-accent-700 hover:text-accent-200"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
