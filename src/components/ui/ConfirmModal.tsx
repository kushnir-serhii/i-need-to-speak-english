'use client';

import { useNotificationStore } from '@/store/useNotificationStore';

export function ConfirmModal() {
  const modal = useNotificationStore((s) => s.modal);
  const closeModal = useNotificationStore((s) => s.closeModal);

  if (modal === null) return null;

  function handleConfirm() {
    modal!.onConfirm();
    closeModal();
  }

  const confirmClass =
    modal.variant === 'danger'
      ? 'bg-[#DA3633] hover:bg-red-600 text-white'
      : 'bg-[#2F81F7] hover:bg-blue-500 text-white';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={closeModal}
    >
      <div
        className="bg-[#161B22] rounded-xl max-w-sm w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white mb-2">{modal.title}</h2>
        <p className="text-sm text-gray-400 mb-6">{modal.message}</p>
        <div className="flex gap-3 justify-end">
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
            onClick={closeModal}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${confirmClass}`}
            onClick={handleConfirm}
          >
            {modal.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
