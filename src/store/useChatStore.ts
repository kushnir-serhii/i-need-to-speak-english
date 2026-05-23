'use client';

import { create } from 'zustand';

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
  addMessage: (role: Message['role'], content: string, streaming?: boolean) => string;
  setStreaming: (value: boolean) => void;
  clearMessages: () => void;
  appendChunk: (id: string, chunk: string) => void;
  finalizeMessage: (id: string) => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  messages: [],
  isStreaming: false,

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

  clearMessages: () => set({ messages: [] }),

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
}));
