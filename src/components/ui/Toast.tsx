'use client';

import type { Toast as ToastType } from '@/store/useNotificationStore';

interface ToastProps {
  id: string;
  type: ToastType['type'];
  message: string;
  onDismiss: (id: string) => void;
}

const borderColor: Record<ToastType['type'], string> = {
  info: '#9184d9',
  warning: '#D29922',
  error: '#DA3633',
};

const icons: Record<ToastType['type'], string> = {
  info: 'ℹ',
  warning: '⚠',
  error: '✕',
};

const iconColor: Record<ToastType['type'], string> = {
  info: '#9184d9',
  warning: '#D29922',
  error: '#DA3633',
};

export function Toast({ id, type, message, onDismiss }: ToastProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      style={{ borderLeftColor: borderColor[type] }}
      className="flex min-w-[280px] max-w-[480px] items-center gap-3 rounded-md border-l-4 bg-surface px-4 py-3 shadow-lg"
    >
      {/* Type icon */}
      <span
        aria-hidden="true"
        style={{ color: iconColor[type] }}
        className="shrink-0 text-base font-bold leading-none"
      >
        {icons[type]}
      </span>

      {/* Message */}
      <p className="flex-1 text-sm text-white">{message}</p>

      {/* Dismiss button */}
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(id)}
        className="shrink-0 text-gray-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        ✕
      </button>
    </div>
  );
}
