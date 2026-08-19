'use client';

import { useMemo, useState } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useChatStore } from '@/store/useChatStore';
import { useNotification } from '@/hooks/useNotification';
import { useTTS } from '@/hooks/useTTS';

export default function SettingsPage() {
  const apiKey = useSettingsStore((s) => s.apiKey);
  const setApiKey = useSettingsStore((s) => s.setApiKey);
  const clearApiKey = useSettingsStore((s) => s.clearApiKey);
  const ttsEnabled = useSettingsStore((s) => s.ttsEnabled);
  const setTtsEnabled = useSettingsStore((s) => s.setTtsEnabled);
  const selectedVoiceURI = useSettingsStore((s) => s.selectedVoiceURI);
  const setSelectedVoiceURI = useSettingsStore((s) => s.setSelectedVoiceURI);
  const targetLanguage = useSettingsStore((s) => s.targetLanguage);
  const setTargetLanguage = useSettingsStore((s) => s.setTargetLanguage);
  const sessionTokens = useChatStore((s) => s.sessionTokens);
  const { toast } = useNotification();

  const { isSupported, voices } = useTTS({ targetLanguage });

  const [inputValue, setInputValue] = useState<string>(apiKey);
  const [langSearch, setLangSearch] = useState<string>(targetLanguage);
  const [langFocused, setLangFocused] = useState<boolean>(false);

  const displayNames = useMemo(
    () => new Intl.DisplayNames('en', { type: 'language' }),
    [],
  );

  const availableLanguages = useMemo<string[]>(() => {
    if (voices.length === 0) return [];
    const seen = new Set<string>();
    const result: string[] = [];
    for (const voice of voices) {
      const primaryTag = voice.lang.split('-')[0];
      let name: string;
      try {
        name = displayNames.of(primaryTag) ?? primaryTag;
      } catch {
        name = primaryTag;
      }
      if (!seen.has(name)) {
        seen.add(name);
        result.push(name);
      }
    }
    return result.sort((a, b) => a.localeCompare(b));
  }, [voices, displayNames]);

  const filteredLanguages = useMemo<string[]>(() => {
    const query = langSearch.trim().toLowerCase();
    if (!query) return availableLanguages;
    return availableLanguages.filter((lang) =>
      lang.toLowerCase().includes(query),
    );
  }, [availableLanguages, langSearch]);

  function handleLangFocus(): void {
    setLangFocused(true);
    setLangSearch('');
  }

  function handleLangBlur(): void {
    setLangFocused(false);
    setLangSearch(targetLanguage);
  }

  function handleLangSelect(lang: string): void {
    setTargetLanguage(lang);
    setLangSearch(lang);
    setLangFocused(false);
  }

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
    <div className="custom-scrollbar flex flex-1 flex-col overflow-y-auto bg-[#0D1117] px-4 py-8 sm:px-8">
      <h1 className="mb-8 font-[--font-inter] text-2xl font-bold text-[#F0F6FC]">Settings</h1>

      {/* Your AI Key */}
      <section className="mb-8 rounded-lg border border-[#30363D] bg-[#161B22] p-6">
        <h2 className="mb-1 text-base font-semibold text-[#F0F6FC]">Your AI Key</h2>
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
            className="rounded-md bg-[#2F81F7] px-4 py-2 text-sm font-medium text-white hover:bg-[#2F81F7]/80 focus:ring-2 focus:ring-[#2F81F7] focus:ring-offset-2 focus:ring-offset-[#161B22] focus:outline-none"
          >
            Save
          </button>

          {apiKey !== '' && (
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-md border border-[#30363D] px-4 py-2 text-sm font-medium text-[#8B949E] hover:border-red-500 hover:text-red-400 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#161B22] focus:outline-none"
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

      {/* Language */}
      <section className="mb-8 rounded-lg border border-[#30363D] bg-[#161B22] p-6">
        <h2 className="mb-1 text-base font-semibold text-[#F0F6FC]">Language</h2>
        <p className="mb-4 text-sm text-[#8B949E]">Choose the language you want to practise.</p>

        {availableLanguages.length === 0 ? (
          <p className="text-sm text-[#8B949E]">No voices available in your browser.</p>
        ) : (
          <div className="relative">
            <input
              type="text"
              value={langSearch}
              onChange={(e) => setLangSearch(e.target.value)}
              onFocus={handleLangFocus}
              onBlur={handleLangBlur}
              placeholder="Search language…"
              className="w-full rounded-md border border-[#30363D] bg-[#0D1117] px-3 py-2 text-sm text-[#F0F6FC] placeholder-[#8B949E] outline-none focus:border-[#2F81F7] focus:ring-1 focus:ring-[#2F81F7]"
            />
            {langFocused && filteredLanguages.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-[#30363D] bg-[#161B22] py-1 shadow-lg">
                {filteredLanguages.map((lang) => (
                  <li key={lang}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleLangSelect(lang);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-[#21262D] ${
                        lang === targetLanguage ? 'font-semibold text-[#2F81F7]' : 'text-[#F0F6FC]'
                      }`}
                    >
                      {lang}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* Text to Speech */}
      <section className="mb-8 rounded-lg border border-[#30363D] bg-[#161B22] p-6">
        <h2 className="mb-1 text-base font-semibold text-[#F0F6FC]">Text to Speech</h2>
        <p className="mb-4 text-sm text-[#8B949E]">
          Automatically read AI responses aloud after they finish streaming.
        </p>

        {/* Enable auto-play row */}
        <div className="mb-4 flex items-center justify-between">
          <label htmlFor="tts-enabled" className="text-sm font-medium text-[#F0F6FC]">
            Enable auto-play
          </label>
          <input
            id="tts-enabled"
            type="checkbox"
            checked={ttsEnabled}
            onChange={(e) => setTtsEnabled(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-[#2F81F7]"
          />
        </div>

        {/* Voice selector — only when enabled, supported, and voices available */}
        {ttsEnabled && isSupported && voices.length > 0 && (
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="tts-voice" className="text-sm font-medium text-[#F0F6FC]">
              Voice
            </label>
            <select
              id="tts-voice"
              value={selectedVoiceURI ?? ''}
              onChange={(e) => setSelectedVoiceURI(e.target.value || null)}
              className="rounded-md border border-[#30363D] bg-[#0D1117] px-3 py-2 text-sm text-[#F0F6FC] outline-none focus:border-[#2F81F7] focus:ring-1 focus:ring-[#2F81F7]"
            >
              <option value="">Default (system)</option>
              {voices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Unsupported notice */}
        {!isSupported && (
          <p className="text-sm text-[#8B949E]">Text-to-speech is not supported in this browser.</p>
        )}
      </section>
    </div>
  );
}
