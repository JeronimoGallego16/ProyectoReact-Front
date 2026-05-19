export interface FormField {
    id: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select';
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    options?: { value: string; label: string }[];
    required?: boolean;
    error?: string;
}

interface GenericFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    title: string;
    fields: FormField[];
    isLoading: boolean;
}

export default function GenericFormModal({
    isOpen,
    onClose,
    onSave,
    title,
    fields,
    isLoading,
}: GenericFormModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="mx-auto my-auto flex w-full max-w-2xl max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-stroke bg-white shadow-2xl dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke px-6 py-5 dark:border-strokedark">
                    <h2 className="text-xl font-semibold text-black dark:text-white">{title}</h2>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-6.5">
                    {fields.map((field) => (
                        <div key={field.id}>
                            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                {field.label}
                                {field.required && <span className="text-red-500"> *</span>}
                            </label>

                            {field.type === 'select' ? (
                                <select
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-medium text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                                >
                                    <option value="">Seleccionar...</option>
                                    {field.options?.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type={field.type}
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    placeholder={field.placeholder}
                                    className={`w-full rounded-lg border px-4 py-3 font-medium text-black outline-none transition dark:bg-transparent dark:text-white ${field.error ? 'border-red-500' : 'border-stroke dark:border-form-strokedark'
                                        }`}
                                />
                            )}

                            {field.error && <p className="mt-1 text-xs text-red-500">{field.error}</p>}
                        </div>
                    ))}
                </div>

                <div className="flex gap-3 border-t border-stroke p-6.5 pt-0 dark:border-strokedark">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 rounded-md border border-stroke px-4 py-2.5 font-medium text-black transition hover:bg-gray-2 dark:border-strokedark dark:text-white dark:hover:bg-meta-4 disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSave}
                        disabled={isLoading}
                        className="flex-1 rounded-md bg-primary px-4 py-2.5 font-medium text-white transition hover:bg-opacity-90 disabled:opacity-50"
                    >
                        {isLoading ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
}