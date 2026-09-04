'use client';

import { useSettingsStore } from '@/store/useSettingsStore';

export default function PromptCard() {
  const customPrompt = useSettingsStore((s) => s.customPrompt);
  const useCustomPrompt = useSettingsStore((s) => s.useCustomPrompt);
  const setCustomPrompt = useSettingsStore((s) => s.setCustomPrompt);
  const setUseCustomPrompt = useSettingsStore((s) => s.setUseCustomPrompt);

  return (
    <section className="rounded-lg border border-neutral-800 bg-surface p-6">
      <h2 className="mb-1 text-base font-semibold text-ink">
        AI Instruction
      </h2>
      <p className="mb-4 text-sm text-neutral-500">
        Use the default system prompt or write your own custom instruction for
        the AI.
      </p>

      {/* Toggle pills */}
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setUseCustomPrompt(false)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface ${
            !useCustomPrompt
              ? 'bg-accent text-white'
              : 'border border-neutral-800 text-neutral-500 hover:border-[#9397ab] hover:text-ink'
          }`}
        >
          Default
        </button>
        <button
          type="button"
          onClick={() => setUseCustomPrompt(true)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface ${
            useCustomPrompt
              ? 'bg-accent text-white'
              : 'border border-neutral-800 text-neutral-500 hover:border-[#9397ab] hover:text-ink'
          }`}
        >
          Custom
        </button>
      </div>

      {/* Textarea */}
      <textarea
        value={customPrompt}
        onChange={(e) => setCustomPrompt(e.target.value)}
        disabled={!useCustomPrompt}
        placeholder="Write a custom instruction for the AI (e.g. Respond only in formal English and correct my grammar after each reply)"
        rows={4}
        className={`w-full resize-y rounded-md border border-neutral-800 bg-bg px-3 py-2 text-sm text-ink placeholder-neutral-500 outline-none transition-opacity focus:border-accent focus:ring-1 focus:ring-accent ${
          !useCustomPrompt ? 'cursor-not-allowed opacity-50' : 'opacity-100'
        }`}
      />
    </section>
  );
}
