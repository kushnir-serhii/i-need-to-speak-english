'use client';

import { useSettingsStore } from '@/store/useSettingsStore';

export default function PromptCard() {
  const customPrompt = useSettingsStore((s) => s.customPrompt);
  const useCustomPrompt = useSettingsStore((s) => s.useCustomPrompt);
  const setCustomPrompt = useSettingsStore((s) => s.setCustomPrompt);
  const setUseCustomPrompt = useSettingsStore((s) => s.setUseCustomPrompt);

  return (
    <section className="rounded-lg border border-[#30363D] bg-[#161B22] p-6">
      <h2 className="mb-1 text-base font-semibold text-[#F0F6FC]">
        AI Instruction
      </h2>
      <p className="mb-4 text-sm text-[#8B949E]">
        Use the default system prompt or write your own custom instruction for
        the AI.
      </p>

      {/* Toggle pills */}
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setUseCustomPrompt(false)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#2F81F7] focus:ring-offset-2 focus:ring-offset-[#161B22] ${
            !useCustomPrompt
              ? 'bg-[#2F81F7] text-white'
              : 'border border-[#30363D] text-[#8B949E] hover:border-[#8B949E] hover:text-[#F0F6FC]'
          }`}
        >
          Default
        </button>
        <button
          type="button"
          onClick={() => setUseCustomPrompt(true)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#2F81F7] focus:ring-offset-2 focus:ring-offset-[#161B22] ${
            useCustomPrompt
              ? 'bg-[#2F81F7] text-white'
              : 'border border-[#30363D] text-[#8B949E] hover:border-[#8B949E] hover:text-[#F0F6FC]'
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
        className={`w-full resize-y rounded-md border border-[#30363D] bg-[#0D1117] px-3 py-2 text-sm text-[#F0F6FC] placeholder-[#8B949E] outline-none transition-opacity focus:border-[#2F81F7] focus:ring-1 focus:ring-[#2F81F7] ${
          !useCustomPrompt ? 'cursor-not-allowed opacity-50' : 'opacity-100'
        }`}
      />
    </section>
  );
}
