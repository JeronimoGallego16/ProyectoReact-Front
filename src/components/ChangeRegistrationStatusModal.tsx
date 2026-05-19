import { Student } from '../models/student';

interface ChangeRegistrationStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (newStatus: boolean) => void;
    isLoading: boolean;
    selectedStudent: Student | null;
    isActive: boolean;
}

export default function ChangeRegistrationStatusModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
    selectedStudent,
    isActive,
}: ChangeRegistrationStatusModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="mx-auto my-auto flex w-full max-w-2xl max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-stroke bg-white shadow-2xl dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke px-6 py-5 dark:border-strokedark">
                    <h2 className="text-xl font-semibold text-black dark:text-white">Cambiar Estado</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-6.5">
                    <p className="mb-6 text-sm text-body dark:text-bodydark">
                        {selectedStudent
                            ? `${selectedStudent.profile?.first_name || ''} ${selectedStudent.profile?.last_name || ''}`.trim()
                            : 'Estudiante no encontrado'}
                    </p>

                    <p className="mb-6 text-sm text-body dark:text-bodydark">
                        {isActive
                            ? '¿Desea marcar esta matrícula como retirada?'
                            : '¿Desea reactivar esta matrícula?'}
                    </p>

                    <div className="flex gap-3 border-t border-stroke pt-6 dark:border-strokedark">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 rounded-md border border-stroke px-4 py-2.5 font-medium text-black transition hover:bg-gray-2 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => onConfirm(!isActive)}
                            disabled={isLoading}
                            className={`flex-1 rounded-md px-4 py-2.5 font-medium text-white transition ${isActive ? 'bg-red-700 hover:bg-red-800' : 'bg-green-700 hover:bg-green-800'
                                } disabled:opacity-50`}
                        >
                            {isLoading ? 'Procesando...' : isActive ? 'Retirar' : 'Activar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
