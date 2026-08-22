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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-modal-title"
    >
      <div className="bg-[#ffffff] border border-amber-300 rounded-sm w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-50 border border-amber-200 rounded-sm text-amber-700 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 id="unsaved-modal-title" className="text-base font-bold text-[#101418] font-serif">
              Unsaved Changes Detected
            </h3>
            <p className="text-xs text-[#54595d] mt-1 leading-relaxed font-sans">
              You have modifications that have not been saved to the database. Leaving this page will discard any unsaved draft content.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#eaecf0]">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 bg-[#f8f9fa] hover:bg-[#eaecf0] text-[#101418] border border-[#a2a9b1] rounded-sm text-xs font-semibold cursor-pointer transition-colors"
          >
            Continue Editing
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 rounded-sm text-xs font-semibold cursor-pointer transition-colors"
          >
            Discard &amp; Leave
          </button>
        </div>
      </div>
    </div>
  );
};
