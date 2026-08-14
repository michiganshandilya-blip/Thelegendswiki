import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-modal-title"
    >
      <div className="bg-[#0e1424] border border-amber-500/50 rounded-sm w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-950/80 border border-amber-800/80 rounded-sm text-amber-400 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 id="unsaved-modal-title" className="text-base font-bold text-slate-100 font-display">
              Unsaved Changes Detected
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              You have modifications that have not been saved to the database. Leaving this page will discard any unsaved draft content.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-sm text-xs font-semibold cursor-pointer transition-colors"
          >
            Continue Editing
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3.5 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 rounded-sm text-xs font-semibold cursor-pointer transition-colors"
          >
            Discard &amp; Leave
          </button>
        </div>
      </div>
    </div>
  );
};
