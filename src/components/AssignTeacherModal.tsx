interface AssignTeacherModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAssign: () => void;
    isLoading: boolean;
    selectedGroupId: string;
    selectedGroupName: string;
    selectedTeacherId: string;
    onTeacherChange: (teacherId: string) => void;
    selectedSemesterId: string;
    onSemesterChange: (semesterId: string) => void;
    groups: any[];
    teachers: any[];
    semesters: any[];
}

export default function AssignTeacherModal({
    isOpen,
    onClose,
    onAssign,
    isLoading,
    selectedGroupId,
    selectedGroupName,
    selectedTeacherId,
    onTeacherChange,
    selectedSemesterId,
    onSemesterChange,
    groups,
    teachers,
    semesters,
}: AssignTeacherModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="mx-auto my-auto flex w-full max-w-2xl max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-stroke bg-white shadow-2xl dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke px-6 py-5 dark:border-strokedark">
                    <h2 className="text-xl font-semibold text-black dark:text-white">Asignar Docente a Grupo</h2>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-6.5">
                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">Grupo Seleccionado</label>
                    <div className="w-full rounded-lg border border-stroke bg-gray-2 px-4 py-3 text-black dark:border-strokedark dark:bg-meta-4 dark:text-white">
                        {selectedGroupName}
                    </div>

                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">Seleccionar Semestre</label>
                    <select
                        value={selectedSemesterId}
                        onChange={(e) => onSemesterChange(e.target.value)}
                        className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-medium text-black outline-none transition focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    >
                        <option value="">-- Selecciona un semestre --</option>
                        {semesters.map((semester) => (
                            <option key={semester.id} value={semester.id}>
                                {semester.name || semester.codigo}
                            </option>
                        ))}
                    </select>

                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">Seleccionar Docente</label>
                    <select
                        value={selectedTeacherId}
                        onChange={(e) => onTeacherChange(e.target.value)}
                        className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-medium text-black outline-none transition focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    >
                        <option value="">-- Selecciona un docente --</option>
                        {teachers.map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>
                                {teacher.name}
                            </option>
                        ))}
                    </select>
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
                        onClick={onAssign}
                        disabled={isLoading}
                        className="flex-1 rounded-md bg-primary px-4 py-2.5 font-medium text-white transition hover:bg-opacity-90 disabled:opacity-50"
                    >
                        {isLoading ? 'Asignando...' : 'Asignar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
