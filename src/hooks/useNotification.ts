import { useNotificationStore } from '@/store/useNotificationStore';
import type { Toast, ModalState } from '@/store/useNotificationStore';

type ToastType = Toast['type'];

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  variant: ModalState['variant'];
  onConfirm: () => void;
}

/**
 * Returns stable dispatcher callbacks for toasts and confirm modals.
 *
 * Uses `getState()` rather than a subscription — callers are dispatchers, not
 * renderers, so there is no need to re-render when store state changes.
 * (react-best-practices: rerender-defer-reads)
 */
export function useNotification() {
  function toast(type: ToastType, message: string): void {
    useNotificationStore.getState().addToast(type, message);
  }

  function confirm(options: ConfirmOptions): void {
    useNotificationStore.getState().openModal(options);
  }

  return { toast, confirm };
}
