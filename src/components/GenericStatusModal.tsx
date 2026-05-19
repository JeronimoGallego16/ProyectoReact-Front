interface GenericStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (newStatus: boolean) => void;
    isLoading: boolean;
    title: string;
    message: string;
    itemName: string;
    currentStatus: boolean;
    confirmText?: string;
    cancelText?: string;
}

export default function GenericStatusModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
    title,
    message,
    itemName,
    currentStatus,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
}: GenericStatusModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="mx-auto my-auto flex w-full max-w-2xl max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-stroke bg-white shadow-2xl dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke px-6 py-5 dark:border-strokedark">
                    <h2 className="text-xl font-semibold text-black dark:text-white">{title}</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-6.5">
                    <p className="mb-4 text-sm text-body dark:text-bodydark">{itemName}</p>
                    <p className="mb-6 text-sm text-body dark:text-bodydark">{message}</p>
                </div>

                <div className="flex gap-3 border-t border-stroke p-6.5 pt-0 dark:border-strokedark">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 rounded-md border border-stroke px-4 py-2.5 font-medium text-black transition hover:bg-gray-2 dark:border-strokedark dark:text-white dark:hover:bg-meta-4 disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => onConfirm(!currentStatus)}
                        disabled={isLoading}
                        className={`flex-1 rounded-md px-4 py-2.5 font-medium text-white transition disabled:opacity-50 ${currentStatus
                                ? 'bg-red-700 hover:bg-red-800'
                                : 'bg-green-700 hover:bg-green-800'
                            }`}
                    >
                        {isLoading ? 'Procesando...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
