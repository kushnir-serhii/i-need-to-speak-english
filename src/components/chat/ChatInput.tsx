'use client';

import { useState, useCallback, useRef, type KeyboardEvent } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useUserStore } from '@/store/useUserStore';
import { useNotification } from '@/hooks/useNotification';
import { CharCounter } from './CharCounter';

export function ChatInput() {
  const [inputValue, setInputValue] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useNotification();

  const handleSubmit = useCallback(async () => {
    const userContent = inputValue.trim();
    if (!userContent) return;

    // Clear textarea immediately
    setInputValue('');

    // Add user message to store
    useChatStore.getState().addMessage('user', userContent);

    // Add assistant placeholder (streaming = true so TypingIndicator shows)
    const assistantId = useChatStore.getState().addMessage('assistant', '', true);

    // Set store-level streaming flag
    useChatStore.getState().setStreaming(true);

    // Build API payload — exclude the empty assistant placeholder
    const allMessages = useChatStore.getState().messages;
    const apiMessages = allMessages
      .filter((msg) => msg.content.trim() !== '')
      .map(({ role, content }) => ({ role, content }));

    // Get visitor id
    const visitorId = useUserStore.getState().visitorId ?? 'anonymous';

    // Create an AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, visitorId }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        useChatStore.getState().appendChunk(assistantId, decoder.decode(value, { stream: true }));
      }

      useChatStore.getState().finalizeMessage(assistantId);
    } catch (error: unknown) {
      // AbortError is not a real error — ignore it
      if (error instanceof DOMException && error.name === 'AbortError') {
        useChatStore.getState().finalizeMessage(assistantId);
        return;
      }
      useChatStore.getState().finalizeMessage(assistantId);
      toast('error', 'Something went wrong. Please try again.');
    }
  }, [inputValue, toast]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void handleSubmit();
      }
    },
    [handleSubmit],
  );

  const isEmpty = inputValue.trim() === '';

  return (
    <div className="p-4 border-t border-[#30363D] bg-[#0D1117]">
      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <textarea
            rows={3}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            className="bg-[#161B22] text-[#F0F6FC] rounded-xl border border-[#30363D] resize-none px-3 py-2 text-sm w-full focus:outline-none focus:border-[#2F81F7] placeholder-[#8B949E]"
          />
          <div className="flex justify-end">
            <CharCounter count={inputValue.length} />
          </div>
        </div>

        <button
          type="button"
          disabled={isEmpty}
          onClick={() => void handleSubmit()}
          className="bg-[#2F81F7] hover:bg-blue-500 text-white rounded-lg px-3 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 self-start mt-0.5"
        >
          Send
        </button>
      </div>
    </div>
  );
}
