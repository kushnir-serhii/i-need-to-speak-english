'use client';

import { cn } from '@/utils/cn';
import { useEffect, useRef, useState } from 'react';
import { BsThreeDotsVertical } from 'react-icons/bs';

interface MessageMenuProps {
  content: string;
  onDelete: () => void;
  side?: 'left' | 'right';
  role: 'user' | 'assistant';
  ttsEnabled: boolean;
  onRepeat: () => void;
  ttsSpeed?: number;
  onSpeedChange?: (speed: number) => void;
  voices?: SpeechSynthesisVoice[];
  selectedVoiceURI?: string | null;
  onVoiceChange?: (uri: string) => void;
}

export function MessageMenu({
  content,
  onDelete,
  side = 'right',
  role,
  ttsEnabled,
  onRepeat,
  ttsSpeed = 1,
  onSpeedChange = () => {},
  voices = [],
  selectedVoiceURI = null,
  onVoiceChange = () => {},
}: MessageMenuProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSpeedOpen, setIsSpeedOpen] = useState<boolean>(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState<boolean>(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleMouseDown(event: MouseEvent): void {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isOpen]);

  // Clean up copy timer on unmount
  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  function handleCopy(): void {
    navigator.clipboard.writeText(content).catch(() => {
      // silently ignore clipboard errors (e.g. insecure context)
    });

    setCopied(true);
    setIsOpen(false);

    if (copyTimerRef.current !== null) {
      clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = setTimeout(() => {
      setCopied(false);
      copyTimerRef.current = null;
    }, 1500);
  }

  function handleRepeat(): void {
    onRepeat();
    setIsOpen(false);
  }

  function handleDelete(): void {
    onDelete();
    setIsOpen(false);
  }

  return (
    <div ref={menuRef} className={`relative`}>
      {/* Three-dot trigger */}
      <button
        type="button"
        aria-haspopup="true"
        aria-label="Message options"
        aria-expanded={isOpen}  
        onClick={() => setIsOpen((prev) => !prev)}
        className="grid h-8 w-8 place-items-center rounded-lg text-neutral-500 transition-colors duration-150 hover:bg-neutral-900 hover:text-accent-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
      >
        <BsThreeDotsVertical className="h-4 w-4" />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          role="menu"
          className={cn(
            'absolute top-full z-50 mt-1 min-w-[130px] rounded-lg border border-neutral-800 bg-surface py-1 shadow-lg',
            side === 'left' ? 'right-0' : 'left-0',
          )}
        >
          {role === 'assistant' && ttsEnabled && (
            <button
              type="button"
              role="menuitem"
              onClick={handleRepeat}
              className="w-full px-3 py-1.5 text-left text-sm text-ink transition-colors duration-100 hover:bg-neutral-800 focus:outline-none focus-visible:bg-neutral-800"
            >
              Repeat
            </button>
          )}

          {role === 'assistant' && (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={() => setIsSpeedOpen((prev) => !prev)}
                className="w-full px-3 py-1.5 text-left text-sm text-ink transition-colors duration-100 hover:bg-neutral-800 focus:outline-none focus-visible:bg-neutral-800"
              >
                Speed {ttsSpeed.toFixed(1)}×
              </button>
              {isSpeedOpen && (
                <div className="px-3 pb-2">
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.25"
                    value={ttsSpeed}
                    onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}

              {/* Voice selector */}
              <button
                type="button"
                role="menuitem"
                onClick={() => setIsVoiceOpen((prev) => !prev)}
                className="w-full px-3 py-1.5 text-left text-sm text-ink transition-colors duration-100 hover:bg-neutral-800 focus:outline-none focus-visible:bg-neutral-800"
              >
                {voices.find((v) => v.voiceURI === selectedVoiceURI)?.name ?? 'Voice'}
              </button>
              {isVoiceOpen && (
                <div className="max-h-40 overflow-y-auto">
                  {voices.length === 0 ? (
                    <div className="cursor-default px-3 py-1.5 text-sm text-neutral-500 select-none">
                      No voices available
                    </div>
                  ) : (
                    voices.map((voice) => {
                      const isSelected = voice.voiceURI === selectedVoiceURI;
                      return (
                        <button
                          key={voice.voiceURI}
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            onVoiceChange(voice.voiceURI);
                            setIsVoiceOpen(false);
                          }}
                          className={`w-full px-3 py-1.5 text-left text-sm transition-colors duration-100 hover:bg-neutral-800 focus:outline-none focus-visible:bg-neutral-800 ${isSelected ? "text-accent" : "text-ink"}`}
                        >
                          {isSelected ? `✓ ${voice.name}` : voice.name}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={handleCopy}
            className="w-full px-3 py-1.5 text-left text-sm text-ink transition-colors duration-100 hover:bg-neutral-800 focus:outline-none focus-visible:bg-neutral-800"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={handleDelete}
            className="w-full px-3 py-1.5 text-left text-sm text-red-400 transition-colors duration-100 hover:bg-neutral-800 focus:outline-none focus-visible:bg-neutral-800"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
