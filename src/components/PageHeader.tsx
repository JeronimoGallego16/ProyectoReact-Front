import React, { ReactNode } from "react";

interface PrimaryAction {
    label: ReactNode;
    onClick: () => void;
    className?: string;
    disabled?: boolean;
}

interface PageHeaderProps {
    title: ReactNode;
    description?: ReactNode;
    children?: ReactNode;
    primaryAction?: PrimaryAction;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, children, primaryAction }) => {
    return (
        <div className="mb-6 flex items-center justify-between">
            <div>
                <h3 className="text-lg font-semibold text-black dark:text-white">{title}</h3>
                {description && (
                    <p className="text-sm text-body dark:text-bodydark">{description}</p>
                )}
            </div>

            <div className="flex items-center gap-3">
                {primaryAction && (
                    <button
                        onClick={primaryAction.onClick}
                        disabled={primaryAction.disabled}
                        className={primaryAction.className ?? "inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"}
                    >
                        {primaryAction.label}
                    </button>
                )}

                {children}
            </div>
        </div>
    );
};

export default PageHeader;