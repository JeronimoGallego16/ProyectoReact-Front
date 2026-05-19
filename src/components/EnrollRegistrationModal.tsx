import { Student } from '../models/student';
import { Career } from '../models/Career';

interface EnrollRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    isLoading: boolean;
    formData: {
        studentId: string;
        careerId: string;
        admissionPeriod: string;
        academicStatus: string;
    };
    onFormChange: (data: any) => void;
    students: Student[];
    careers: Career[];
    dateError: string;
}

export default function EnrollRegistrationModal({
    isOpen,
    onClose,
    onSave,
    isLoading,
    formData,
    onFormChange,
    students,
    careers,
    dateError,
}: EnrollRegistrationModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="mx-auto my-auto flex w-full max-w-2xl max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-stroke bg-white shadow-2xl dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke px-6 py-5 dark:border-strokedark">
                    <h2 className="text-xl font-semibold text-black dark:text-white">Matricular Estudiante</h2>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-6.5">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">Estudiante *</label>
                        <select
                            value={formData.studentId}
                            onChange={(e) => onFormChange({ ...formData, studentId: e.target.value })}
                            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-medium text-black outline-none transition focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        >
                            <option value="">-- Selecciona un estudiante --</option>
                            {students.filter((s) => s.is_active).map((stud) => (
                                <option key={stud.id} value={stud.id}>
                                    {stud.profile?.first_name} {stud.profile?.last_name} ({stud.profile?.identification})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">Carrera *</label>
                        <select
                            value={formData.careerId}
                            onChange={(e) => onFormChange({ ...formData, careerId: e.target.value })}
                            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-medium text-black outline-none transition focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        >
                            <option value="">-- Selecciona una carrera --</option>
                            {careers.filter((c) => c.is_active).map((career) => (
                                <option key={career.id} value={career.id}>
                                    {career.code} - {career.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">Período de Ingreso *</label>
                        <input
                            type="date"
                            value={formData.admissionPeriod}
                            onChange={(e) => onFormChange({ ...formData, admissionPeriod: e.target.value })}
                            className={`w-full rounded-lg border px-4 py-3 font-medium text-black outline-none transition dark:bg-transparent dark:text-white ${dateError ? 'border-red-500' : 'border-stroke dark:border-form-strokedark'
                                }`}
                        />
                        {dateError && <p className="mt-1 text-xs text-red-500">{dateError}</p>}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">Estado Académico *</label>
                        <select
                            value={formData.academicStatus}
                            onChange={(e) => onFormChange({ ...formData, academicStatus: e.target.value })}
                            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-medium text-black outline-none transition focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        >
                            <option value="ACTIVE">Activo</option>
                            <option value="INACTIVE">Inactivo</option>
                            <option value="SUSPENDED">Suspendido</option>
                            <option value="GRADUATED">Graduado</option>
                            <option value="RETIRED">Retirado</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-3 border-t border-stroke p-6.5 pt-0 dark:border-strokedark">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 rounded-md border border-stroke px-4 py-2.5 font-medium text-black transition hover:bg-gray-2 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSave}
                        disabled={isLoading}
                        className="flex-1 rounded-md bg-primary px-4 py-2.5 font-medium text-white transition hover:bg-opacity-90 disabled:opacity-50"
                    >
                        {isLoading ? 'Matriculando...' : 'Matricular'}
                    </button>
                </div>
            </div>
        </div>
    );
}
