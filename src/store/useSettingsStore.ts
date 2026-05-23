import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';

interface SettingsState {
  theme: Theme;
  targetLanguage: string;
  visitorName: string | null;
  hasSeenNamePrompt: boolean;
  toggleTheme: () => void;
  setVisitorName: (name: string | null) => void;
  markNamePromptSeen: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      targetLanguage: 'English',
      visitorName: null,
      hasSeenNamePrompt: false,
      toggleTheme: () => {
        const nextTheme: Theme = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: nextTheme });
        if (typeof window !== 'undefined') {
          if (nextTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },
      setVisitorName: (name: string | null) => {
        set({ visitorName: name });
      },
      markNamePromptSeen: () => {
        set({ hasSeenNamePrompt: true });
      },
    }),
    {
      name: 'intse-settings',
    },
  ),
);
