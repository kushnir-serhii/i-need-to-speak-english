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
        className="flex h-6 w-6 items-center justify-center rounded text-white transition-colors duration-150 hover:bg-[#30363D] hover:text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-[#2F81F7]"
      >
        <BsThreeDotsVertical className="h-4 w-4" />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          role="menu"
          className={cn(
            'absolute top-full right-0 z-50 mt-1 min-w-[110px] rounded-lg border border-[#30363D] bg-[#161B22] py-1 shadow-lg',
            {
              'left-0': side !== 'left',
            },
          )}
        >
          {role === 'assistant' && ttsEnabled && (
            <button
              type="button"
              role="menuitem"
              onClick={handleRepeat}
              className="w-full px-3 py-1.5 text-left text-sm text-white transition-colors duration-100 hover:bg-[#30363D] focus:outline-none focus-visible:bg-[#30363D]"
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
                className="w-full px-3 py-1.5 text-left text-sm text-white transition-colors duration-100 hover:bg-[#30363D] focus:outline-none focus-visible:bg-[#30363D]"
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
                className="w-full px-3 py-1.5 text-left text-sm text-white transition-colors duration-100 hover:bg-[#30363D] focus:outline-none focus-visible:bg-[#30363D]"
              >
                {voices.find((v) => v.voiceURI === selectedVoiceURI)?.name ?? 'Voice'}
              </button>
              {isVoiceOpen && (
                <div className="max-h-40 overflow-y-auto">
                  {voices.length === 0 ? (
                    <div className="cursor-default px-3 py-1.5 text-sm text-[#8B949E] select-none">
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
                          className={`w-full px-3 py-1.5 text-left text-sm transition-colors duration-100 hover:bg-[#30363D] focus:outline-none focus-visible:bg-[#30363D] ${isSelected ? 'text-[#2F81F7]' : 'text-white'}`}
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
            className="w-full px-3 py-1.5 text-left text-sm text-white transition-colors duration-100 hover:bg-[#30363D] focus:outline-none focus-visible:bg-[#30363D]"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={handleDelete}
            className="w-full px-3 py-1.5 text-left text-sm text-[#F85149] transition-colors duration-100 hover:bg-[#30363D] focus:outline-none focus-visible:bg-[#30363D]"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
