'use client';

import { useState, useCallback, type ReactElement } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useChatStore } from '@/store/useChatStore';
import { useUserStore } from '@/store/useUserStore';

const LANGUAGES: readonly string[] = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi',
  'Dutch', 'Polish', 'Turkish', 'Swedish', 'Norwegian', 'Danish',
  'Finnish', 'Greek', 'Czech', 'Romanian', 'Hungarian', 'Ukrainian',
];

export function LanguageSelectorCard(): ReactElement {
  const targetLanguage = useSettingsStore((s) => s.targetLanguage);
  const setTargetLanguage = useSettingsStore((s) => s.setTargetLanguage);

  const messages = useChatStore((s) => s.messages);
  const sessionId = useChatStore((s) => s.sessionId);
  const clearMessages = useChatStore((s) => s.clearMessages);
  const initSessionId = useChatStore((s) => s.initSessionId);

  const visitorId = useUserStore((s) => s.visitorId);

  const [search, setSearch] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const filteredLanguages = search.trim() === ''
    ? LANGUAGES
    : LANGUAGES.filter((lang) =>
        lang.toLowerCase().includes(search.trim().toLowerCase()),
      );

  const handleOpen = useCallback((): void => {
    setSearch('');
    setIsOpen(true);
  }, []);

  const handleClose = useCallback((): void => {
    setIsOpen(false);
    setSearch('');
  }, []);

  const handleSelect = useCallback(
    async (lang: string): Promise<void> => {
      setIsOpen(false);
      setSearch('');

      if (lang === targetLanguage) return;

      if (messages.length > 0) {
        setIsSaving(true);
        try {
          await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, visitorId, messages }),
          });
        } catch {
          // Silently swallow network errors
        } finally {
          setIsSaving(false);
        }
      }

      setTargetLanguage(lang);
      clearMessages();
      initSessionId();
    },
    [targetLanguage, messages, sessionId, visitorId, setTargetLanguage, clearMessages, initSessionId],
  );

  return (
    <section className="mb-8 rounded-lg border border-[#30363D] bg-[#161B22] p-6">
      <h2 className="mb-1 text-base font-semibold text-[#F0F6FC]">Language</h2>
      <p className="mb-4 text-sm text-[#8B949E]">
        Choose the language you want to practise.
      </p>

      <div className="relative">
        <input
          type="text"
          value={isOpen ? search : targetLanguage}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={handleOpen}
          onBlur={handleClose}
          placeholder="Search language…"
          disabled={isSaving}
          className="w-full rounded-md border border-[#30363D] bg-[#0D1117] px-3 py-2 text-sm text-[#F0F6FC] placeholder-[#8B949E] outline-none focus:border-[#2F81F7] focus:ring-1 focus:ring-[#2F81F7] disabled:cursor-not-allowed disabled:opacity-50"
        />

        {isSaving && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8B949E]">
            Saving…
          </span>
        )}

        {isOpen && filteredLanguages.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-[#30363D] bg-[#161B22] py-1 shadow-lg">
            {filteredLanguages.map((lang) => (
              <li key={lang}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    void handleSelect(lang);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-[#21262D] ${
                    lang === targetLanguage
                      ? 'font-semibold text-[#2F81F7]'
                      : 'text-[#F0F6FC]'
                  }`}
                >
                  {lang}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
