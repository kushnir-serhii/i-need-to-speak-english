'use client';

import { useState, useCallback, useRef, useEffect, type KeyboardEvent } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useUserStore } from '@/store/useUserStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useNotification } from '@/hooks/useNotification';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { langToSpeechCode } from '@/utils/langToSpeechCode';
import { AutoDialogToggle } from './AutoDialogToggle';
import { CharCounter } from './CharCounter';
import { STTButton } from './STTButton';
import { TTSButton } from './TTSButton';

interface ChatInputProps {
  disabled?: boolean;
  onLimitReached?: () => void;
  speak?: (id: string, text: string) => void;
  stop?: () => void;
  isSupported?: boolean;
  ttsEnabled?: boolean;
  onTTSToggle?: () => void;
}

export function ChatInput({
  disabled = false,
  onLimitReached,
  speak,
  stop: _stop,
  isSupported: ttsIsSupported = false,
  ttsEnabled = false,
  onTTSToggle,
}: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useNotification();

  const isStreaming = useChatStore((s) => s.isStreaming);
  const autoDialogActive = useChatStore((s) => s.autoDialogActive);
  const setAutoDialogActive = useChatStore((s) => s.setAutoDialogActive);

  const lang = langToSpeechCode(useSettingsStore.getState().targetLanguage);
  const { isListening, isSupported, startListening } = useSpeechToText({
    lang,
    onInterimResult: (transcript) => setInputValue(transcript),
    onFinalResult: (transcript) => {
      setInputValue(transcript);
      if (useChatStore.getState().autoDialogActive) {
        setTimeout(() => void handleSubmit(transcript), 0);
      }
    },
    onError: (errorCode) => {
      let message: string;
      if (errorCode === 'not-allowed') {
        message = 'Microphone access was denied. Please allow it in your browser settings.';
      } else if (errorCode === 'no-speech') {
        message = 'No speech was detected. Please try again.';
      } else {
        message = 'Voice input encountered an error. Please try again.';
      }
      toast('error', message);
    },
  });

  useEffect(() => {
    if (!isSupported) {
      toast('error', "Speech recognition isn't supported in this browser. Try Chrome or Edge.");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback(async (overrideValue?: string) => {
    const userContent = (overrideValue ?? inputValue).trim();
    if (!userContent) return;

    // Ensure a session ID exists for this conversation
    useChatStore.getState().initSessionId();

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
        body: JSON.stringify({
          messages: apiMessages,
          visitorId,
          ...(useSettingsStore.getState().apiKey !== '' && {
            apiKey: useSettingsStore.getState().apiKey,
          }),
          ...(useSettingsStore.getState().targetLanguage && {
            targetLanguage: useSettingsStore.getState().targetLanguage,
          }),
        }),
        signal: controller.signal,
      });

      if (response.status === 429) {
        useChatStore.getState().finalizeMessage(assistantId);
        onLimitReached?.();
        return;
      }

      if (response.status === 400 || response.status === 401) {
        let errorCode: string | undefined;
        try {
          const body = await response.json() as { error?: string };
          errorCode = body.error;
        } catch {
          // JSON parse failed — fall through to generic error
        }
        if (
          (response.status === 400 && errorCode === 'invalid_api_key_format') ||
          (response.status === 401 && errorCode === 'invalid_api_key')
        ) {
          useChatStore.getState().finalizeMessage(assistantId);
          toast('error', 'Your API key appears to be invalid. Please check it in Settings.');
          return;
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const decoded = decoder.decode(value, { stream: true });

        if (decoded.includes('\x00')) {
          const [textPart, sentinelPart] = decoded.split('\x00') as [string, string];
          if (textPart !== '') {
            useChatStore.getState().appendChunk(assistantId, textPart);
          }
          try {
            const jsonStr = sentinelPart.startsWith('USAGE:')
              ? sentinelPart.slice('USAGE:'.length)
              : sentinelPart;
            const parsed = JSON.parse(jsonStr) as { inputTokens: number; outputTokens: number; totalTokens: number };
            useChatStore.getState().addSessionTokens(parsed.totalTokens);
          } catch {
            // Sentinel JSON parse failed — continue silently
          }
        } else {
          useChatStore.getState().appendChunk(assistantId, decoded);
        }
      }

      useChatStore.getState().finalizeMessage(assistantId);

      // Trigger TTS for the completed assistant message if enabled
      if (useSettingsStore.getState().ttsEnabled) {
        const msg = useChatStore.getState().messages.find((m) => m.id === assistantId);
        if (msg?.content) {
          speak?.(assistantId, msg.content);
        }
      }

      useUserStore.getState().incrementRequests();
    } catch (error: unknown) {
      // AbortError is not a real error — ignore it
      if (error instanceof DOMException && error.name === 'AbortError') {
        useChatStore.getState().finalizeMessage(assistantId);
        return;
      }
      useChatStore.getState().finalizeMessage(assistantId);
      toast('error', 'Something went wrong. Please try again.');
    }
  }, [inputValue, toast, speak]);

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
  const isDisabled = disabled || isEmpty;

  return (
    <div className="p-4 border-t border-[#30363D] bg-[#0D1117]">
      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <textarea
            rows={3}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Type a message…"
            className="bg-[#161B22] text-[#F0F6FC] rounded-xl border border-[#30363D] resize-none px-3 py-2 text-sm w-full focus:outline-none focus:border-[#2F81F7] placeholder-[#8B949E] disabled:opacity-40 disabled:cursor-not-allowed"
          />
          <div className="flex justify-end">
            <CharCounter count={inputValue.length} />
          </div>
        </div>

        <STTButton
          isListening={isListening}
          disabled={disabled || isStreaming}
          isSupported={isSupported}
          onClick={startListening}
        />

        <AutoDialogToggle
          isActive={autoDialogActive}
          disabled={disabled || isStreaming}
          onClick={() => {
            const next = !autoDialogActive;
            setAutoDialogActive(next);
            if (next) startListening();
          }}
        />

        <TTSButton
          isEnabled={ttsEnabled}
          isSupported={ttsIsSupported}
          disabled={disabled || isStreaming}
          onClick={() => onTTSToggle?.()}
        />

        <button
          type="button"
          disabled={isDisabled}
          onClick={() => void handleSubmit()}
          className="bg-[#2F81F7] hover:bg-blue-500 text-white rounded-lg px-3 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 self-start mt-0.5"
        >
          Send
        </button>
      </div>
    </div>
  );
}
