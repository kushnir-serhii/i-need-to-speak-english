'use client';

interface STTButtonProps {
  isListening: boolean;
  disabled: boolean;
  isSupported: boolean;
  onClick: () => void;
}

export function STTButton({
  isListening,
  disabled,
  isSupported,
  onClick,
}: STTButtonProps) {
  const isEffectivelyDisabled = disabled || !isSupported;

  const colorClass = isEffectivelyDisabled
    ? 'text-[#8B949E] opacity-40 cursor-not-allowed'
    : isListening
    ? 'text-[#2F81F7] animate-pulse'
    : 'text-[#8B949E] hover:text-[#F0F6FC]';

  return (
    <button
      type="button"
      disabled={isEffectivelyDisabled}
      onClick={onClick}
      aria-label={isListening ? 'Stop recording' : 'Start voice input'}
      className={`px-3 py-2 rounded-lg shrink-0 self-start mt-0.5 transition-colors ${colorClass}`}
    >
      {/* Simple microphone SVG icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="9" y="2" width="6" height="11" rx="3" />
        <path d="M5 10a7 7 0 0 0 14 0" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="8" y1="22" x2="16" y2="22" />
      </svg>
    </button>
  );
}
