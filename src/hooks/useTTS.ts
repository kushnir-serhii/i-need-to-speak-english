'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { langToSpeechCode } from '@/utils/langToSpeechCode';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useChatStore } from '@/store/useChatStore';

interface UseTTSParams {
  targetLanguage: string;
}

interface UseTTSReturn {
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  speak: (id: string, text: string) => void;
  stop: () => void;
  repeat: (id: string, text: string) => void;
}

export function useTTS({ targetLanguage }: UseTTSParams): UseTTSReturn {
  const isSupported =
    typeof window !== 'undefined' &&
    typeof window.speechSynthesis !== 'undefined';

  const allVoicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Playback queue — items waiting to be spoken
  const queue = useRef<Array<{ id: string; text: string }>>([]);
  // Guards re-entrant drain calls while an utterance is playing
  const isPlaying = useRef<boolean>(false);

  useEffect(() => {
    if (!isSupported) return;

    function loadVoices(): void {
      const all = window.speechSynthesis.getVoices();
      allVoicesRef.current = all;

      const prefix = langToSpeechCode(targetLanguage).slice(0, 2);
      const filtered = all.filter((v) => v.lang.startsWith(prefix));
      setVoices(filtered);
    }

    // Firefox loads voices synchronously; Chrome/Edge fire voiceschanged async
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      // Cancel any in-progress speech on unmount
      window.speechSynthesis.cancel();
      queue.current.length = 0;
      isPlaying.current = false;
      useChatStore.getState().setSpeakingMessageId(null);
    };
    // Re-run when targetLanguage changes so the filtered list stays in sync
  }, [isSupported, targetLanguage]);

  // Resolve which voice to use: selectedVoiceURI → first filtered → null (browser default)
  const _resolveVoice = useCallback((): SpeechSynthesisVoice | null => {
    const selectedVoiceURI = useSettingsStore.getState().selectedVoiceURI;
    const prefix = langToSpeechCode(targetLanguage).slice(0, 2);
    const filteredVoices = allVoicesRef.current.filter((v) =>
      v.lang.startsWith(prefix),
    );

    if (selectedVoiceURI !== null) {
      const match = filteredVoices.find((v) => v.voiceURI === selectedVoiceURI);
      if (match) return match;
    }

    if (filteredVoices.length > 0) return filteredVoices[0];

    return null;
  }, [targetLanguage]);

  // Drain the queue: pick the next item and speak it
  const _drain = useCallback((): void => {
    if (isPlaying.current) return;
    if (queue.current.length === 0) return;

    const item = queue.current.shift()!;
    isPlaying.current = true;
    useChatStore.getState().setSpeakingMessageId(item.id);

    const resolvedVoice = _resolveVoice();
    const utterance = new SpeechSynthesisUtterance(item.text);
    if (resolvedVoice !== null) {
      utterance.voice = resolvedVoice;
    }
    utterance.rate = useSettingsStore.getState().ttsSpeed;

    utterance.onend = () => {
      isPlaying.current = false;
      useChatStore.getState().setSpeakingMessageId(null);
      _drain();
    };

    utterance.onerror = (e) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('TTS error:', e.error);
      }
      isPlaying.current = false;
      useChatStore.getState().setSpeakingMessageId(null);
      _drain();
    };

    window.speechSynthesis.speak(utterance);
  }, [_resolveVoice]);

  const speak = useCallback((id: string, text: string): void => {
    if (!isSupported) return;
    // Duplicate guard — skip if already queued
    const alreadyQueued = queue.current.some((item) => item.id === id);
    if (alreadyQueued) return;

    queue.current.push({ id, text });
    _drain();
  }, [isSupported, _drain]);

  const stop = useCallback((): void => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    queue.current.length = 0;
    isPlaying.current = false;
    useChatStore.getState().setSpeakingMessageId(null);
  }, [isSupported]);

  const repeat = useCallback((id: string, text: string): void => {
    if (!isSupported) return;
    stop();
    queue.current.push({ id, text });
    _drain();
  }, [isSupported, stop, _drain]);

  if (!isSupported) {
    return { isSupported: false, voices: [], speak, stop, repeat };
  }

  return { isSupported, voices, speak, stop, repeat };
}
