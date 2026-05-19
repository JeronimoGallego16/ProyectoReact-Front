import { Student } from '../models/student';
import { Career } from '../models/Career';

interface DetailRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedRegistration: any | null;
    selectedStudent: Student | null;
    selectedCareer: Career | null;
}

export default function DetailRegistrationModal({
    isOpen,
    onClose,
    selectedRegistration,
    selectedStudent,
    selectedCareer,
}: DetailRegistrationModalProps) {
    if (!isOpen || !selectedRegistration) return null;

    return (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="mx-auto my-auto flex w-full max-w-2xl max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-stroke bg-white shadow-2xl dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke px-6 py-5 dark:border-strokedark">
                    <h2 className="text-xl font-semibold text-black dark:text-white">Detalles de Matrícula</h2>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto p-6.5">
                    <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Estudiante</p>
                        <p className="text-black dark:text-white">
                            {selectedStudent
                                ? `${selectedStudent.profile?.first_name || ''} ${selectedStudent.profile?.last_name || ''}`.trim()
                                : 'No encontrado'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Carrera</p>
                        <p className="text-black dark:text-white">{selectedCareer?.name || 'No encontrada'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Período de Ingreso</p>
                        <p className="text-black dark:text-white">
                            {selectedRegistration?.admission_period
                                ? new Date(selectedRegistration.admission_period).toLocaleDateString('es-ES')
                                : 'N/A'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Estado</p>
                        <p className={selectedRegistration?.is_active ? 'text-green-600' : 'text-red-600'}>
                            {selectedRegistration?.is_active ? 'Activo' : 'Retirado'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 border-t border-stroke p-6.5 pt-0 dark:border-strokedark">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-md border border-stroke px-4 py-2.5 font-medium text-black transition hover:bg-gray-2 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
