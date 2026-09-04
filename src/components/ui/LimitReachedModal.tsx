'use client';

import { useState } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LimitReachedModal({ isOpen, onClose }: LimitReachedModalProps) {
  const [showKeyField, setShowKeyField] = useState(false);
  const [keyValue, setKeyValue] = useState('');

  if (!isOpen) return null;

  const handleEnterKey = () => {
    setShowKeyField(true);
  };

  const handleSaveKey = () => {
    useSettingsStore.getState().setApiKey(keyValue);
    onClose();
  };

  const handleCancel = () => {
    setShowKeyField(false);
    setKeyValue('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="bg-surface rounded-xl max-w-sm w-full mx-4 p-6 border border-neutral-800">
        <p className="text-neutral-500 text-sm leading-relaxed mb-6">
          You&apos;ve reached today&apos;s limit. Come back tomorrow! You can also use your own key to continue.
        </p>

        {!showKeyField && (
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleEnterKey}
              className="px-4 py-2 rounded-lg text-sm text-ink border border-neutral-800 hover:bg-neutral-900 transition-colors"
            >
              Enter your key
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-white bg-accent hover:bg-accent-400 transition-colors"
            >
              OK
            </button>
          </div>
        )}

        {showKeyField && (
          <div className="flex flex-col gap-3">
            <input
              type="password"
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              placeholder="sk-…"
              className="w-full px-3 py-2 rounded-lg text-sm text-ink bg-bg border border-neutral-800 placeholder-neutral-500 focus:outline-none focus:border-accent transition-colors"
            />
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg text-sm text-ink border border-neutral-800 hover:bg-neutral-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveKey}
                className="px-4 py-2 rounded-lg text-sm text-white bg-accent hover:bg-accent-400 transition-colors"
              >
                Save key
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
