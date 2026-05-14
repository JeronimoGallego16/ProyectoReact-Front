import React, { ReactNode } from "react";

interface AppModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: ReactNode;
    description?: ReactNode;
    children: ReactNode;
    maxWidthClassName?: string;
}

const AppModal: React.FC<AppModalProps> = ({
    isOpen,
    onClose,
    title,
    description,
    children,
    maxWidthClassName = "max-w-4xl",
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/50 px-4">
            <div className={`w-full ${maxWidthClassName} rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark`}>
                <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                        <h4 className="text-xl font-semibold text-black dark:text-white">{title}</h4>
                        {description && (
                            <p className="mt-1 text-sm text-body dark:text-bodydark">{description}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border border-stroke px-3 py-1 text-sm font-medium text-body hover:bg-gray-2 dark:border-strokedark dark:text-bodydark"
                    >
                        Cerrar
                    </button>
                </div>

                {children}
            </div>
        </div>
    );
};

export default AppModal;