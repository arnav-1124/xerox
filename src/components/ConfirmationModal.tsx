import React from 'react';
import { X, AlertTriangle, HelpCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-popover border border-border rounded-2xl p-6 shadow-2xl text-popover-foreground relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isDestructive 
              ? 'bg-destructive/10 border border-destructive/20 text-destructive' 
              : 'bg-blue-500/10 border border-blue-500/20 text-blue-500'
          }`}>
            {isDestructive ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <HelpCircle className="w-5 h-5" />
            )}
          </div>
          <div className="space-y-1.5 min-w-0 flex-1">
            <h3 className="text-sm font-bold text-foreground truncate">{title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex gap-2.5 pt-5 mt-5 border-t border-border justify-end text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl font-semibold bg-secondary hover:bg-accent text-secondary-foreground border border-border transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl font-semibold text-white transition-colors cursor-pointer ${
              isDestructive 
                ? 'bg-destructive hover:bg-destructive/90 shadow-sm shadow-destructive/10' 
                : 'bg-blue-600 hover:bg-blue-500 shadow-sm shadow-blue-500/10'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
