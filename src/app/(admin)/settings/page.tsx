'use client';

import { useState } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useChatStore } from '@/store/useChatStore';
import { useNotification } from '@/hooks/useNotification';

export default function SettingsPage() {
  const apiKey = useSettingsStore((s) => s.apiKey);
  const setApiKey = useSettingsStore((s) => s.setApiKey);
  const clearApiKey = useSettingsStore((s) => s.clearApiKey);
  const sessionTokens = useChatStore((s) => s.sessionTokens);
  const { toast } = useNotification();

  const [inputValue, setInputValue] = useState<string>(apiKey);

  function handleSave(): void {
    setApiKey(inputValue);
    toast('info', 'API key saved.');
  }

  function handleRemove(): void {
    clearApiKey();
    setInputValue('');
    toast('info', 'API key removed.');
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-[#0D1117] px-4 py-8 sm:px-8">
      <h1
        className="mb-8 font-[var(--font-inter)] text-2xl font-bold text-[#F0F6FC]"
      >
        Settings
      </h1>

      {/* Your AI Key */}
      <section className="mb-8 rounded-lg border border-[#30363D] bg-[#161B22] p-6">
        <h2 className="mb-1 text-base font-semibold text-[#F0F6FC]">
          Your AI Key
        </h2>
        <p className="mb-4 text-sm text-[#8B949E]">
          Paste your own OpenAI API key to remove daily message limits.
        </p>

        <input
          type="password"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="sk-..."
          className="mb-3 w-full rounded-md border border-[#30363D] bg-[#0D1117] px-3 py-2 text-sm text-[#F0F6FC] placeholder-[#8B949E] outline-none focus:border-[#2F81F7] focus:ring-1 focus:ring-[#2F81F7]"
        />

        {apiKey !== '' && (
          <p className="mb-4 text-sm text-[#8B949E]">
            Tokens used this session:{' '}
            <span className="font-(--font-jetbrains-mono)">{sessionTokens}</span>
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-[#2F81F7] px-4 py-2 text-sm font-medium text-white hover:bg-[#2F81F7]/80 focus:outline-none focus:ring-2 focus:ring-[#2F81F7] focus:ring-offset-2 focus:ring-offset-[#161B22]"
          >
            Save
          </button>

          {apiKey !== '' && (
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-md border border-[#30363D] px-4 py-2 text-sm font-medium text-[#8B949E] hover:border-red-500 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#161B22]"
            >
              Remove key
            </button>
          )}
        </div>
      </section>

      {/* Appearance (placeholder) */}
      <section className="mb-8 rounded-lg border border-[#30363D] bg-[#161B22] p-6">
        <h2 className="text-base font-semibold text-[#F0F6FC]">Appearance</h2>
      </section>

      {/* Language (placeholder) */}
      <section className="mb-8 rounded-lg border border-[#30363D] bg-[#161B22] p-6">
        <h2 className="text-base font-semibold text-[#F0F6FC]">Language</h2>
      </section>
    </div>
  );
}
