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
  ttsSpeed: number;
  setTtsSpeed: (speed: number) => void;
  customPrompt: string;
  useCustomPrompt: boolean;
  setCustomPrompt: (prompt: string) => void;
  setUseCustomPrompt: (active: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      targetLanguage: 'English',
      visitorName: null,
      hasSeenNamePrompt: false,
      apiKey: '',
      ttsEnabled: true,
      selectedVoiceURI: null,
      ttsSpeed: 1,
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
      setTtsSpeed: (speed: number) => set({ ttsSpeed: Math.min(2.0, Math.max(0.5, speed)) }),
      customPrompt: '',
      useCustomPrompt: false,
      setCustomPrompt: (prompt: string) => set({ customPrompt: prompt }),
      setUseCustomPrompt: (active: boolean) => set({ useCustomPrompt: active }),
    }),
    {
      name: 'intse-settings',
    },
  ),
);
