import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';

interface SettingsState {
  theme: Theme;
  targetLanguage: string;
  visitorName: string | null;
  hasSeenNamePrompt: boolean;
  apiKey: string;
  ttsEnabled: boolean;
  selectedVoiceURI: string | null;
  toggleTheme: () => void;
  setVisitorName: (name: string | null) => void;
  markNamePromptSeen: () => void;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  setTtsEnabled: (v: boolean) => void;
  setSelectedVoiceURI: (uri: string | null) => void;
  setTargetLanguage: (lang: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      targetLanguage: 'English',
      visitorName: null,
      hasSeenNamePrompt: false,
      apiKey: '',
      ttsEnabled: false,
      selectedVoiceURI: null,
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
      setApiKey: (key: string) => {
        set({ apiKey: key });
      },
      clearApiKey: () => {
        set({ apiKey: '' });
      },
      setTtsEnabled: (v: boolean) => {
        set({ ttsEnabled: v });
      },
      setSelectedVoiceURI: (uri: string | null) => {
        set({ selectedVoiceURI: uri });
      },
      setTargetLanguage: (lang: string) => {
        set({ targetLanguage: lang, selectedVoiceURI: null });
      },
    }),
    {
      name: 'intse-settings',
    },
  ),
);
