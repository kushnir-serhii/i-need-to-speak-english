import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

interface SettingsState {
  theme: Theme;
  targetLanguage: string;
  level: CefrLevel;
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
  setLevel: (level: CefrLevel) => void;
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
      level: 'B1',
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
      setLevel: (level: CefrLevel) => {
        set({ level });
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
