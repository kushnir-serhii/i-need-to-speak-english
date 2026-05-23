'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { langToSpeechCode } from '@/utils/langToSpeechCode';

interface UseSpeechToTextParams {
  lang: string;
  onInterimResult: (transcript: string) => void;
  onFinalResult: (transcript: string) => void;
  onError: (errorCode: string) => void;
}

interface UseSpeechToTextReturn {
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
}

// Minimal local types for the Web Speech API (not always in lib.dom.d.ts)
interface SpeechRecognitionResultItem {
  readonly transcript: string;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionResultItem;
  [index: number]: SpeechRecognitionResultItem | undefined;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult | undefined;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionConstructor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechToText({
  lang,
  onInterimResult,
  onFinalResult,
  onError,
}: UseSpeechToTextParams): UseSpeechToTextReturn {
  const SpeechRecognitionCtor = getSpeechRecognitionConstructor();
  const isSupported = SpeechRecognitionCtor !== null;

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Keep callbacks in refs so recognition handlers are always fresh
  // without needing to reinstantiate the recognition object.
  const onInterimRef = useRef(onInterimResult);
  const onFinalRef = useRef(onFinalResult);
  const onErrorRef = useRef(onError);

  useEffect(() => { onInterimRef.current = onInterimResult; }, [onInterimResult]);
  useEffect(() => { onFinalRef.current = onFinalResult; }, [onFinalResult]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  // Instantiate once
  useEffect(() => {
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = langToSpeechCode(lang);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result === undefined) continue;
        const transcript = result[0]?.transcript ?? '';
        if (result.isFinal) {
          onFinalRef.current(transcript);
          setIsListening(false);
        } else {
          onInterimRef.current(transcript);
        }
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      onErrorRef.current(event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      recognitionRef.current = null;
    };
    // Intentionally omitting `lang` — lang changes are handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [SpeechRecognitionCtor]);

  // Update lang when it changes, without reinstantiating
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = langToSpeechCode(lang);
    }
  }, [lang]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
  }, []);

  if (!isSupported) {
    return {
      isListening: false,
      isSupported: false,
      startListening: () => {},
      stopListening: () => {},
    };
  }

  return { isListening, isSupported, startListening, stopListening };
}
