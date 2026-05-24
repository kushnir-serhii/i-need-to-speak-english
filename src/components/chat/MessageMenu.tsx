'use client';

import { useEffect, useRef, useState } from 'react';

interface MessageMenuProps {
  content: string;
  onDelete: () => void;
  side?: 'left' | 'right';
  role: 'user' | 'assistant';
  ttsEnabled: boolean;
  onRepeat: () => void;
  ttsSpeed?: number;
  onSpeedChange?: (speed: number) => void;
}

export function MessageMenu({ content, onDelete, side = 'right', role, ttsEnabled, onRepeat, ttsSpeed = 1, onSpeedChange = () => {} }: MessageMenuProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSpeedOpen, setIsSpeedOpen] = useState<boolean>(false);

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
    <div ref={menuRef} className={`absolute top-2 ${side === 'left' ? 'left-2' : 'right-2'}`}>
      {/* Three-dot trigger */}
      <button
        type="button"
        aria-label="Message options"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-center w-6 h-6 rounded text-[#8B949E] hover:text-white hover:bg-[#30363D] transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#2F81F7]"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="7" cy="2.5" r="1.25" />
          <circle cx="7" cy="7" r="1.25" />
          <circle cx="7" cy="11.5" r="1.25" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 min-w-[110px] rounded-lg border border-[#30363D] bg-[#161B22] shadow-lg py-1 z-50"
        >
          {role === 'assistant' && ttsEnabled && (
            <button
              type="button"
              role="menuitem"
              onClick={handleRepeat}
              className="w-full text-left px-3 py-1.5 text-sm text-white hover:bg-[#30363D] transition-colors duration-100 focus:outline-none focus-visible:bg-[#30363D]"
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
                className="w-full text-left px-3 py-1.5 text-sm text-white hover:bg-[#30363D] transition-colors duration-100 focus:outline-none focus-visible:bg-[#30363D]"
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
            </>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={handleCopy}
            className="w-full text-left px-3 py-1.5 text-sm text-white hover:bg-[#30363D] transition-colors duration-100 focus:outline-none focus-visible:bg-[#30363D]"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={handleDelete}
            className="w-full text-left px-3 py-1.5 text-sm text-[#F85149] hover:bg-[#30363D] transition-colors duration-100 focus:outline-none focus-visible:bg-[#30363D]"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
