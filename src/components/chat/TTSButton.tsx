'use client';

interface TTSButtonProps {
  isEnabled: boolean;
  isSupported: boolean;
  disabled: boolean;
  onClick: () => void;
}

export function TTSButton({
  isEnabled,
  isSupported,
  disabled,
  onClick,
}: TTSButtonProps) {
  if (!isSupported) return null;

  const colorClass = disabled
    ? 'text-[#8B949E] opacity-40 cursor-not-allowed'
    : isEnabled
    ? 'text-[#2F81F7]'
    : 'text-[#8B949E] hover:text-[#F0F6FC]';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={isEnabled ? 'Disable text-to-speech' : 'Enable text-to-speech'}
      className={`px-3 py-2 rounded-lg shrink-0 self-start mt-0.5 transition-colors ${colorClass}`}
    >
      {/* Speaker icon with two sound wave arcs */}
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
        {/* Speaker cone */}
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        {/* Inner wave arc */}
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        {/* Outer wave arc */}
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
    </button>
  );
}
