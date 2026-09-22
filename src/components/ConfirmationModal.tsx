import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { ThemeMode } from '../types';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  theme: ThemeMode;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isDestructive = true,
  theme,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      <div
        id="confirmation-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border transition-all ${
          isDark
            ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                isDestructive
                  ? isDark
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'bg-red-50 text-red-600 border border-red-200'
                  : isDark
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 id="confirmation-modal-title" className="text-lg font-semibold tracking-tight">
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            type="button"
            aria-label="Close dialog"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className={`text-sm leading-relaxed mb-6 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
          {message}
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            id="confirmation-modal-cancel-btn"
            type="button"
            onClick={onCancel}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer border ${
              isDark
                ? 'border-neutral-700 bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300'
                : 'border-neutral-300 bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
            }`}
          >
            {cancelLabel}
          </button>
          <button
            id="confirmation-modal-confirm-btn"
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer shadow-sm ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-500 text-white active:bg-red-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
