'use client';

import { useState } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';

interface NamePromptProps {
  onDone: () => void;
}

export default function NamePrompt({ onDone }: NamePromptProps) {
  const [inputValue, setInputValue] = useState('');

  function handleConfirm() {
    useSettingsStore.getState().setVisitorName(inputValue.trim() || null);
    useSettingsStore.getState().markNamePromptSeen();
    onDone();
  }

  function handleSkip() {
    useSettingsStore.getState().setVisitorName(null);
    useSettingsStore.getState().markNamePromptSeen();
    onDone();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg px-4">
      <div className="flex w-full max-w-[400px] flex-col items-center gap-4">
        <h1 className="font-[var(--font-inter)] text-2xl font-bold text-ink">
          What&apos;s your name?
        </h1>

        <p className="font-[var(--font-inter)] text-sm font-normal text-neutral-500">
          We&apos;ll use it to greet you.
        </p>

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Your name"
          className="w-full rounded-md border border-neutral-800 bg-surface px-4 py-3 text-ink placeholder-neutral-500 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          autoFocus
        />

        <button
          type="button"
          onClick={handleConfirm}
          className="w-full rounded-md bg-accent px-4 py-3 font-[var(--font-inter)] font-semibold text-white hover:bg-[#388bfd] active:bg-[#1f6feb]"
        >
          Let&apos;s go
        </button>

        <button
          type="button"
          onClick={handleSkip}
          className="font-[var(--font-inter)] text-sm text-neutral-500 hover:text-ink"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
