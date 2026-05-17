import { ReactNode } from 'react';

type ModalLauncherProps = {
  children: (close: () => void) => ReactNode;
  isOpen: boolean;
  onClose: () => void;
  maxWidthClassName?: string;
  overlayClassName?: string;
};

// Reusable controlled modal launcher with built-in backdrop and structure
export default function ModalLauncher({
  children,
  isOpen,
  onClose,
  maxWidthClassName = 'max-w-2xl',
  overlayClassName = '',
}: ModalLauncherProps) {
  const closeModal = () => {
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div className={`fixed inset-0 z-99999 flex items-center justify-center bg-black/50 ${overlayClassName}`}>
          <div className={`relative w-full ${maxWidthClassName} rounded-lg bg-white p-6 shadow-lg dark:bg-boxdark`}>
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
