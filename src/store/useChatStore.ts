'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming: boolean;
  timestamp: number;
}

interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  sessionTokens: number;
  autoDialogActive: boolean;
  speakingMessageId: string | null;
  sessionId: string | null;
  sessionSaved: boolean;
  addMessage: (role: Message['role'], content: string, streaming?: boolean) => string;
  setStreaming: (value: boolean) => void;
  clearMessages: () => void;
  appendChunk: (id: string, chunk: string) => void;
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

  addMessage: (role, content, streaming = false) => {
    const id = crypto.randomUUID();
    const message: Message = {
      id,
      role,
      content,
      isStreaming: streaming,
      timestamp: Date.now(),
    };
    set((state) => ({ messages: [...state.messages, message] }));
    return id;
  },

  setStreaming: (value) => set({ isStreaming: value }),

  clearMessages: () => set({ messages: [], sessionId: null, sessionSaved: false }),

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
    set({ messages, sessionId, sessionSaved: false }),
    }),
    {
      name: 'intse-chat',
      partialize: (state) => ({
        messages: state.messages,
        sessionId: state.sessionId,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
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
