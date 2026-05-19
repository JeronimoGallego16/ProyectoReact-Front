import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ isOpen, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', onConfirm, onCancel }: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-lg rounded bg-white p-6 shadow-lg dark:bg-boxdark">
        {title && <h3 className="mb-2 text-lg font-semibold text-black dark:text-white">{title}</h3>}
        <div className="mb-6 text-sm text-body dark:text-bodydark">{message}</div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded border border-stroke px-6 py-2 text-sm font-medium text-body hover:bg-gray-2 dark:border-strokedark dark:text-bodydark">{cancelLabel}</button>
          <button type="button" onClick={onConfirm} className="rounded bg-red px-6 py-2 text-sm font-medium text-white hover:bg-opacity-90">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
