import React, { useState, useCallback } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<React.ReactNode>('');
  const [title, setTitle] = useState<string | undefined>(undefined);

  const resolverRef = React.useRef<(v: boolean) => void | null>(null);

  const showConfirm = useCallback((msg: React.ReactNode, opts?: { title?: string }) => {
    setMessage(msg);
    setTitle(opts?.title);
    setIsOpen(true);

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    if (resolverRef.current) resolverRef.current(false);
    resolverRef.current = null;
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (resolverRef.current) resolverRef.current(true);
    resolverRef.current = null;
  }, []);

  const ConfirmElement = (
    <ConfirmDialog
      isOpen={isOpen}
      title={title}
      message={message}
      onCancel={handleCancel}
      onConfirm={handleConfirm}
      confirmLabel="Confirmar"
      cancelLabel="Cancelar"
    />
  );

  return { showConfirm, ConfirmElement } as const;
}
