import React from "react";

type CriterionCommentBoxProps = {
    isOpen: boolean;
    comment: string;
    onChange: (value: string) => void;
    onAccept?: () => void;
    onCancel?: () => void;
    acceptLabel?: string;
    cancelLabel?: string;
};

const CriterionCommentBox: React.FC<CriterionCommentBoxProps> = ({
    isOpen,
    comment,
    onChange,
    onAccept,
    onCancel,
    acceptLabel = "Aceptar",
    cancelLabel = "Cancelar",
}) => {
    if (!isOpen) return null;

    return (
        <div className="mt-4 rounded-md border border-dashed border-stroke p-3 dark:border-strokedark">
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Comentario</label>
            <textarea
                value={comment}
                onChange={(event) => onChange(event.target.value)}
                rows={3}
                className="w-full rounded-md border border-stroke bg-transparent px-3 py-2 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:text-white"
                placeholder="Escribe un comentario"
            />

            <div className="mt-3 flex justify-end gap-2">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-md border px-3 py-1 text-sm"
                    >
                        {cancelLabel}
                    </button>
                )}
                {onAccept && (
                    <button
                        type="button"
                        onClick={onAccept}
                        className="rounded-md bg-primary px-3 py-1 text-sm text-white"
                    >
                        {acceptLabel}
                    </button>
                )}
            </div>
        </div>
    );
};

export default CriterionCommentBox;