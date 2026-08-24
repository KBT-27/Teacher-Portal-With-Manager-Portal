import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
}

export const ConfirmDialog: React.FC<{
  state: ConfirmDialogState;
  onClose: () => void;
}> = ({ state, onClose }) => {
  if (!state.isOpen) return null;

  return (
    <div 
      id="in-app-confirm-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        id="in-app-confirm-modal-box"
        className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            state.variant === 'warning' 
              ? 'bg-amber-100 text-amber-600' 
              : 'bg-rose-100 text-rose-600'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <h3 className="text-base font-bold text-slate-900">{state.title || 'Confirm Action'}</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{state.message}</p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            id="in-app-confirm-cancel-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            {state.cancelText || 'Cancel'}
          </button>
          <button
            id="in-app-confirm-action-btn"
            type="button"
            onClick={() => {
              state.onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>{state.confirmText || 'Erase & Confirm'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
