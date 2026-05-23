'use client';

interface AutoDialogToggleProps {
  isActive: boolean;
  disabled: boolean;
  onClick: () => void;
}

export function AutoDialogToggle({ isActive, disabled, onClick }: AutoDialogToggleProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={isActive ? 'Auto-dialog on' : 'Auto-dialog off'}
      className={[
        'rounded-lg px-3 py-2 transition-colors shrink-0 self-start mt-0.5',
        isActive
          ? 'text-[#2F81F7] ring-2 ring-[#2F81F7]/50 bg-[#2F81F7]/10'
          : 'text-[#8B949E] hover:text-[#F0F6FC]',
        disabled ? 'opacity-40 cursor-not-allowed' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Circular arrows icon (auto-dialog loop) */}
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
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </svg>
    </button>
  );
}
