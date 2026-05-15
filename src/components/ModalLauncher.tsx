import { ReactNode } from 'react';

type ModalLauncherProps = {
  children: (close: () => void) => ReactNode;
  isOpen: boolean;
  onClose: () => void;
};

// Reusable controlled modal launcher with built-in backdrop and structure
export default function ModalLauncher({ children, isOpen, onClose }: ModalLauncherProps) {
  const closeModal = () => {
    onClose();
  };

  return (
    <>
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
