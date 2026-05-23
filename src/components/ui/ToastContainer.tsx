'use client';

import { useEffect } from 'react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Toast } from './Toast';

export function ToastContainer() {
  const toasts = useNotificationStore((state) => state.toasts);
  const removeToast = useNotificationStore((state) => state.removeToast);

  // Expose store on window in development for Playwright testing only.
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as unknown as Record<string, unknown>).__notificationStore = useNotificationStore;
    }
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 z-50 flex flex-col-reverse gap-2 left-0 right-0 px-4 xs:left-1/2 xs:right-auto xs:px-0 xs:-translate-x-1/2 xs:w-auto"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          onDismiss={removeToast}
        />
      ))}
    </div>
  );
}
