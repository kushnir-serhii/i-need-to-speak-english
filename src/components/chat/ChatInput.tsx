'use client';

import { useState, useCallback, useRef, useEffect, type KeyboardEvent } from 'react';
import {
  PiMicrophoneFill,
  PiPaperPlaneRightFill,
  PiSlidersHorizontalBold,
  PiRepeatBold,
  PiArrowCounterClockwiseBold,
} from 'react-icons/pi';
import { useChatStore } from '@/store/useChatStore';
import { useUserStore } from '@/store/useUserStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useNotification } from '@/hooks/useNotification';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { langToSpeechCode } from '@/utils/langToSpeechCode';
import { CharCounter } from './CharCounter';

const SUGGESTIONS = ['Ask me a question', 'Say it slower', 'Explain'];

interface ChatInputProps {
  disabled?: boolean;
  onLimitReached?: () => void;
  speak?: (id: string, text: string) => void;
  stop?: () => void;
  isSupported?: boolean;
  ttsEnabled?: boolean;
  onTTSToggle?: () => void;
  /** Text to drop into the composer (from an empty-state / suggestion tap). */
  seedText?: { value: string } | null;
  onOpenSettings?: () => void;
}

export function ChatInput({
  disabled = false,
  onLimitReached,
  speak,
  stop: _stop,
  isSupported: _ttsIsSupported = false,
  ttsEnabled: _ttsEnabled = false,
  onTTSToggle: _onTTSToggle,
  seedText = null,
  onOpenSettings,
}: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useNotification();

  const isStreaming = useChatStore((s) => s.isStreaming);
  const hasMessages = useChatStore((s) => s.messages.length > 0);
  const autoDialogActive = useChatStore((s) => s.autoDialogActive);
  const setAutoDialogActive = useChatStore((s) => s.setAutoDialogActive);
  const speakingMessageId = useChatStore((s) => s.speakingMessageId);

  const apiKey = useSettingsStore((s) => s.apiKey);
  const dailyRequests = useUserStore((s) => s.dailyRequests);
  const dailyRequestLimit = useUserStore((s) => s.dailyRequestLimit);
  const messagesLeft = Math.max(0, dailyRequestLimit - dailyRequests);
  const role = useUserStore((s) => s.role);
  const visitorId = useUserStore((s) => s.visitorId);
  const [resettingLimit, setResettingLimit] = useState(false);

  const handleResetLimit = useCallback(async () => {
    if (!visitorId) return;
    setResettingLimit(true);
    try {
      const r = await fetch(`/api/admin/visitors/${visitorId}/reset`, { method: 'POST' });
      if (!r.ok) {
        toast('error', 'Reset failed.');
        return;
      }
      const data = (await r.json()) as { dailyRequests: number };
      useUserStore.getState().updateStats(
        useUserStore.getState().visitorCount,
        useUserStore.getState().dailyCap,
        data.dailyRequests,
        useUserStore.getState().dailyRequestLimit,
      );
      toast('info', 'Daily limit reset.');
    } catch {
      toast('error', 'Reset failed.');
    } finally {
      setResettingLimit(false);
    }
  }, [visitorId, toast]);

  const lang = langToSpeechCode(useSettingsStore.getState().targetLanguage);
  const { isListening, isSupported, startListening, stopListening } = useSpeechToText({
    lang,
    onInterimResult: (transcript) => setInputValue(transcript),
    onFinalResult: (transcript) => {
      setInputValue(transcript);
      if (useChatStore.getState().autoDialogActive) {
        if (transcript.trim() !== '') {
          // Mark streaming synchronously so the re-arm effect below doesn't
          // see a gap between "stopped listening" and "started streaming"
          // and fire the mic back on before the reply has even started.
          useChatStore.getState().setStreaming(true);
          setTimeout(() => void handleSubmit(transcript), 0);
        } else {
          // Nothing was said — go straight back to listening.
          setTimeout(() => startListening(), 0);
        }
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

  // Auto-grow the textarea.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [inputValue]);

  // Pick up seeded text from an empty-state / suggestion tap.
  useEffect(() => {
    if (seedText) {
      setInputValue(seedText.value);
      textareaRef.current?.focus();
    }
  }, [seedText]);

  // Hands-free: (re)start the mic whenever auto-dialog is on and we're not
  // currently listening, streaming a reply, or playing one back via TTS.
  // This re-arms after every turn, not just when auto-dialog first flips on.
  useEffect(() => {
    if (autoDialogActive && !isListening && !isStreaming && speakingMessageId === null) {
      startListening();
    } else if (!autoDialogActive && isListening) {
      stopListening();
    }
  }, [autoDialogActive, isListening, isStreaming, speakingMessageId, startListening, stopListening]);

  const handleSubmit = useCallback(
    async (overrideValue?: string) => {
      const userContent = (overrideValue ?? inputValue).trim();
      if (!userContent) return;

      useChatStore.getState().initSessionId();
      setInputValue('');
      const userMessageId = useChatStore.getState().addMessage('user', userContent);
      const assistantId = useChatStore.getState().addMessage('assistant', '', true);
      useChatStore.getState().setStreaming(true);

      const allMessages = useChatStore.getState().messages;
      const apiMessages = allMessages
        .filter((msg) => msg.content.trim() !== '')
        .map(({ role, content }) => ({ role, content }));

      const visitorId = useUserStore.getState().visitorId ?? 'anonymous';
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
            level: useSettingsStore.getState().level,
            customPrompt: useSettingsStore.getState().customPrompt,
            useCustomPrompt: useSettingsStore.getState().useCustomPrompt,
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
            const body = (await response.json()) as { error?: string };
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
              const parsed = JSON.parse(jsonStr) as {
                inputTokens: number;
                outputTokens: number;
                totalTokens: number;
              };
              useChatStore.getState().addSessionTokens(parsed.totalTokens);
            } catch {
              // Sentinel JSON parse failed — continue silently
            }
          } else {
            useChatStore.getState().appendChunk(assistantId, decoded);
          }
        }

        useChatStore.getState().finalizeMessage(assistantId);

        // Second pass: quiet grammar correction for the user's turn (design 1a).
        // Skip trivial turns ("yes", "ok thanks") — not worth an extra call.
        if (userContent.split(/\s+/).filter(Boolean).length >= 3) {
          void fetch('/api/correct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: userContent,
              targetLanguage: useSettingsStore.getState().targetLanguage,
              level: useSettingsStore.getState().level,
              ...(useSettingsStore.getState().apiKey !== '' && {
                apiKey: useSettingsStore.getState().apiKey,
              }),
            }),
          })
            .then((r) =>
              r.ok
                ? (r.json() as Promise<{ correction: string | null; explanation?: string | null }>)
                : null,
            )
            .then((data) => {
              if (data?.correction) {
                useChatStore
                  .getState()
                  .setCorrection(userMessageId, data.correction, data.explanation ?? null);
              } else if (data) {
                useChatStore.getState().registerCleanTurn();
              }
            })
            .catch(() => {
              // Correction is best-effort — ignore failures.
            });
        }

        if (useSettingsStore.getState().ttsEnabled) {
          const msg = useChatStore.getState().messages.find((m) => m.id === assistantId);
          if (msg?.content) {
            speak?.(assistantId, msg.content);
          }
        }

        useUserStore.getState().incrementRequests();
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          useChatStore.getState().finalizeMessage(assistantId);
          return;
        }
        useChatStore.getState().finalizeMessage(assistantId);
        toast('error', 'Something went wrong. Please try again.');
      }
    },
    [inputValue, toast, speak, onLimitReached],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void handleSubmit();
      }
    },
    [handleSubmit],
  );

  const hasText = inputValue.trim() !== '';
  const controlsDisabled = disabled || isStreaming;

  return (
    <div className="bg-linear-to-b from-transparent to-[#0f111c]/70 px-4 pt-3 pb-24 md:pb-6">
      <div className="mx-auto flex w-full max-w-[680px] flex-col gap-2.5">
        {/* Suggestion pills — only once the conversation is under way
            (the empty state offers its own). */}
        <div className={`no-scrollbar flex gap-1.5 overflow-x-auto ${hasMessages ? '' : 'hidden'}`}>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              disabled={controlsDisabled}
              onClick={() => setInputValue(s)}
              className="hover:border-accent-700 hover:text-accent-200 shrink-0 rounded-full border border-neutral-800 px-3 py-1.5 text-[13px] text-neutral-300 transition-colors disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2.5">
          {/* Composer */}
          <div className="bg-surface flex min-w-0 flex-1 flex-col gap-2 rounded-[18px] border border-neutral-800 px-3.5 py-3">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder="Type, or hold the mic…"
              className="text-ink w-full resize-none bg-transparent text-[15px] placeholder-neutral-500 focus:outline-none disabled:opacity-40"
            />
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Prompt settings"
                disabled={controlsDisabled}
                onClick={() => onOpenSettings?.()}
                className="hover:text-accent-300 grid h-8 w-8 place-items-center rounded-lg text-neutral-500 transition-colors disabled:opacity-40"
              >
                <PiSlidersHorizontalBold className="text-[17px]" />
              </button>
              <button
                type="button"
                aria-label="Auto dialog"
                aria-pressed={autoDialogActive}
                disabled={controlsDisabled}
                onClick={() => setAutoDialogActive(!autoDialogActive)}
                className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs transition-colors disabled:opacity-40 ${
                  autoDialogActive
                    ? 'bg-accent/12 text-accent-200'
                    : 'hover:text-accent-300 text-neutral-500'
                }`}
              >
                <PiRepeatBold className="text-[15px]" />
                Auto
              </button>
              <span className="flex-1" />
              {role === 'admin' && (
                <button
                  type="button"
                  aria-label="Reset daily limit"
                  disabled={resettingLimit}
                  onClick={() => void handleResetLimit()}
                  className="hover:text-accent-300 grid h-8 w-8 place-items-center rounded-lg text-neutral-500 transition-colors disabled:opacity-40"
                  title="Reset daily limit (owner)"
                >
                  <PiArrowCounterClockwiseBold
                    className={`text-[15px] ${resettingLimit ? 'animate-spin' : ''}`}
                  />
                </button>
              )}
              {inputValue.length > 0 ? (
                <CharCounter count={inputValue.length} />
              ) : apiKey === '' ? (
                <span className="text-xs text-neutral-600 tabular-nums">
                  {messagesLeft} left today
                </span>
              ) : null}
            </div>
          </div>

          {/* Primary action: mic, or send when there's text */}
          <button
            type="button"
            aria-label={hasText ? 'Send' : isListening ? 'Stop' : 'Hold to speak'}
            disabled={disabled || (hasText ? false : !isSupported)}
            onClick={() => (hasText ? void handleSubmit() : startListening())}
            className={`border-accent bg-accent/10 text-accent-200 hover:bg-accent/18 grid h-14 w-14 shrink-0 place-items-center rounded-full border text-2xl shadow-[0_0_0_6px_rgba(145,132,217,0.10)] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              isListening ? 'animate-pulse' : ''
            }`}
          >
            {hasText ? <PiPaperPlaneRightFill /> : <PiMicrophoneFill />}
          </button>
        </div>
      </div>
    </div>
  );
}
