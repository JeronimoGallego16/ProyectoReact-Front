import { ReactNode, useState } from 'react';

type ModalLauncherProps = {
  trigger?: (open: () => void) => ReactNode; // Optional: for external trigger buttons
  children: (close: () => void) => ReactNode;
  isOpen?: boolean; // Optional: control from parent
  onClose?: () => void; // Optional: callback when modal closes
};

// Reusable modal launcher with built-in backdrop and structure
export default function ModalLauncher({ trigger, children, isOpen: externalOpen, onClose }: ModalLauncherProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Support both internal and external state
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  
  const openModal = () => setInternalOpen(true);
  const closeModal = () => {
    setInternalOpen(false);
    onClose?.();
  };

  return (
    <>
      {trigger && trigger(openModal)}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg dark:bg-boxdark">
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Close modal"
            >
              ✕
            </button>
            <div className="pr-6">{children(closeModal)}</div>
          </div>
        </div>
      )}
    </>
  );
}
