import { create } from 'zustand';

export interface Toast {
  id: string;
  type: 'info' | 'warning' | 'error';
  message: string;
}

export interface ModalState {
  title: string;
  message: string;
  confirmLabel: string;
  variant: 'primary' | 'danger';
  onConfirm: () => void;
}

interface NotificationState {
  toasts: Toast[];
  modal: ModalState | null;
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
  openModal: (options: ModalState) => void;
  closeModal: () => void;
}

// Timer map lives in module scope — not in the store state — so it never
// triggers re-renders and can be accessed by both addToast and removeToast.
const timers = new Map<string, ReturnType<typeof setTimeout>>();

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  toasts: [],
  modal: null,

  addToast(type, message) {
    const { toasts, removeToast } = get();

    // If a toast of the same type already exists, remove it first (cancel its timer too).
    const existing = toasts.find((t) => t.type === type);
    if (existing) {
      removeToast(existing.id);
    }

    const id = crypto.randomUUID();

    set((state) => ({
      toasts: [...state.toasts, { id, type, message }],
    }));

    if (type === 'info') {
      const timer = setTimeout(() => {
        removeToast(id);
      }, 4000);
      timers.set(id, timer);
    }
  },

  removeToast(id) {
    // Cancel any pending auto-dismiss timer.
    const timer = timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timers.delete(id);
    }

    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  openModal(options) {
    set({ modal: options });
  },

  closeModal() {
    set({ modal: null });
  },
}));
