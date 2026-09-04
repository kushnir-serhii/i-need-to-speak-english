'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming: boolean;
  timestamp: number;
  /** Optional gentle rewrite of a user message, shown as a "One fix"
   *  card beneath the bubble (design doc 1c). Populated by the
   *  correction pass; safe to leave undefined. */
  correction?: string;
  /** One-line reason for the fix, revealed by the card's "Why" action. */
  correctionNote?: string;
}

interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  sessionTokens: number;
  autoDialogActive: boolean;
  speakingMessageId: string | null;
  sessionId: string | null;
  sessionSaved: boolean;
  /** Epoch ms of the first message in the current session — drives the
   *  header progress ring (design doc 1c). Null until the session starts. */
  startedAt: number | null;
  /** Consecutive user turns that came back with no correction (design 1a). */
  cleanStreak: number;
  addMessage: (role: Message['role'], content: string, streaming?: boolean) => string;
  setStreaming: (value: boolean) => void;
  clearMessages: () => void;
  appendChunk: (id: string, chunk: string) => void;
  setCorrection: (id: string, correction: string | null, note?: string | null) => void;
  registerCleanTurn: () => void;
  finalizeMessage: (id: string) => void;
  addSessionTokens: (n: number) => void;
  setAutoDialogActive: (v: boolean) => void;
  setSpeakingMessageId: (id: string | null) => void;
  deleteMessage: (id: string) => void;
  initSessionId: () => void;
  setSessionSaved: (value: boolean) => void;
  loadSession: (messages: Message[], sessionId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
  messages: [],
  isStreaming: false,
  sessionTokens: 0,
  autoDialogActive: false,
  speakingMessageId: null,
  sessionId: null,
  sessionSaved: false,
  startedAt: null,
  cleanStreak: 0,

  addMessage: (role, content, streaming = false) => {
    const id = crypto.randomUUID();
    const message: Message = {
      id,
      role,
      content,
      isStreaming: streaming,
      timestamp: Date.now(),
    };
    set((state) => ({
      messages: [...state.messages, message],
      startedAt: state.startedAt ?? Date.now(),
    }));
    return id;
  },

  setStreaming: (value) => set({ isStreaming: value }),

  clearMessages: () =>
    set({
      messages: [],
      sessionId: null,
      sessionSaved: false,
      startedAt: null,
      cleanStreak: 0,
    }),

  setSessionSaved: (value) => set({ sessionSaved: value }),

  initSessionId: () =>
    set((state) => ({
      sessionId: state.sessionId ?? crypto.randomUUID(),
    })),

  appendChunk: (id, chunk) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, content: msg.content + chunk } : msg,
      ),
    })),

  setCorrection: (id, correction, note) =>
    set((state) => ({
      cleanStreak: 0,
      messages: state.messages.map((msg) =>
        msg.id === id
          ? {
              ...msg,
              correction: correction ?? undefined,
              correctionNote: correction ? (note ?? undefined) : undefined,
            }
          : msg,
      ),
    })),

  registerCleanTurn: () => set((state) => ({ cleanStreak: state.cleanStreak + 1 })),

  finalizeMessage: (id) =>
    set((state) => ({
      isStreaming: false,
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, isStreaming: false } : msg,
      ),
    })),

  addSessionTokens: (n) =>
    set((state) => ({ sessionTokens: state.sessionTokens + n })),

  setAutoDialogActive: (v) => set({ autoDialogActive: v }),

  setSpeakingMessageId: (id) => set({ speakingMessageId: id }),

  deleteMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== id),
      speakingMessageId: state.speakingMessageId === id ? null : state.speakingMessageId,
    })),

  loadSession: (messages, sessionId) =>
    set({
      messages,
      sessionId,
      sessionSaved: false,
      startedAt: messages[0]?.timestamp ?? null,
      cleanStreak: 0,
    }),
    }),
    {
      name: 'intse-chat',
      partialize: (state) => ({
        messages: state.messages,
        sessionId: state.sessionId,
        startedAt: state.startedAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.startedAt == null && state.messages.length > 0) {
          state.startedAt = state.messages[0].timestamp;
        }
        const hasStreamingMessages = state.messages.some((m) => m.isStreaming);
        if (hasStreamingMessages) {
          state.messages = state.messages.map((m) =>
            m.isStreaming ? { ...m, isStreaming: false } : m,
          );
        }
      },
    },
  ),
);
