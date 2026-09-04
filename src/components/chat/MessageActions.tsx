'use client';

import { useRef, useState } from 'react';
import { PiSpeakerHighBold, PiGaugeBold, PiCopyBold } from 'react-icons/pi';
import { MessageMenu } from './MessageMenu';

interface MessageActionsProps {
  content: string;
  role: 'user' | 'assistant';
  onDelete: () => void;
  ttsEnabled: boolean;
  onRepeat: () => void;
  ttsSpeed: number;
  onSpeedChange: (speed: number) => void;
  voices: SpeechSynthesisVoice[];
  selectedVoiceURI: string | null;
  onVoiceChange: (uri: string) => void;
  /** Right-align the row (used under user bubbles). */
  align?: 'start' | 'end';
}

const iconBtn =
  'grid h-8 w-8 place-items-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-900 hover:text-accent-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent';

/**
 * Inline message actions shown beneath the bubble (design doc 1a) —
 * play / slower / copy, plus an overflow menu (speed, voice, delete)
 * that reuses {@link MessageMenu}.
 */
export function MessageActions({
  content,
  role,
  onDelete,
  ttsEnabled,
  onRepeat,
  ttsSpeed,
  onSpeedChange,
  voices,
  selectedVoiceURI,
  onVoiceChange,
  align = 'start',
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleCopy() {
    navigator.clipboard.writeText(content).catch(() => {});
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1500);
  }

  function handleSlower() {
    onSpeedChange(Math.max(0.5, Number((ttsSpeed - 0.25).toFixed(2))));
    onRepeat();
  }

  return (
    <div className={`flex items-center gap-1 ${align === 'end' ? 'justify-end' : ''}`}>
      {role === 'assistant' && (
        <>
          <button type="button" aria-label="Play" className={iconBtn} onClick={onRepeat}>
            <PiSpeakerHighBold className="text-base" />
          </button>
          <button type="button" aria-label="Slower" className={iconBtn} onClick={handleSlower}>
            <PiGaugeBold className="text-base" />
          </button>
        </>
      )}
      <button type="button" aria-label={copied ? 'Copied' : 'Copy'} className={iconBtn} onClick={handleCopy}>
        <PiCopyBold className={`text-base ${copied ? 'text-accent-300' : ''}`} />
      </button>
      <MessageMenu
        content={content}
        onDelete={onDelete}
        role={role}
        side={align === 'end' ? 'left' : 'right'}
        ttsEnabled={ttsEnabled}
        onRepeat={onRepeat}
        ttsSpeed={ttsSpeed}
        onSpeedChange={onSpeedChange}
        voices={voices}
        selectedVoiceURI={selectedVoiceURI}
        onVoiceChange={onVoiceChange}
      />
    </div>
  );
}
