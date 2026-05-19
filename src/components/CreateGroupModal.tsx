interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    isLoading: boolean;
    formData: {
        groupCode: string;
        groupName: string;
        subjectId: string;
        semesterId: string;
        teacherId: string;
        capacity: string;
    };
    onFormChange: (data: any) => void;
    subjects: any[];
    semesters: any[];
    teachers: any[];
}

export default function CreateGroupModal({
    isOpen,
    onClose,
    onSave,
    isLoading,
    formData,
    onFormChange,
    subjects,
    semesters,
    teachers,
}: CreateGroupModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="mx-auto my-auto flex w-full max-w-2xl max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-stroke bg-white shadow-2xl dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke px-6 py-5 dark:border-strokedark">
                    <h2 className="text-xl font-semibold text-black dark:text-white">Crear Nuevo Grupo</h2>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-6.5">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Código Grupo <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Ej. G-A-01"
                            value={formData.groupCode}
                            onChange={(e) => onFormChange({ ...formData, groupCode: e.target.value })}
                            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-medium text-black outline-none transition focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Nombre Grupo <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Ej. Grupo A"
                            value={formData.groupName}
                            onChange={(e) => onFormChange({ ...formData, groupName: e.target.value })}
                            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-medium text-black outline-none transition focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Asignatura <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.subjectId}
                            onChange={(e) => onFormChange({ ...formData, subjectId: e.target.value })}
                            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-medium text-black outline-none transition focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        >
                            <option value="">-- Selecciona una asignatura --</option>
                            {subjects.map((subject) => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.code} - {subject.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Semestre <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.semesterId}
                            onChange={(e) => onFormChange({ ...formData, semesterId: e.target.value })}
                            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-medium text-black outline-none transition focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        >
                            <option value="">-- Selecciona un semestre --</option>
                            {semesters.map((semester) => (
                                <option key={semester.id} value={semester.id}>
                                    {semester.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Docente <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.teacherId}
                            onChange={(e) => onFormChange({ ...formData, teacherId: e.target.value })}
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

                    <div>
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Capacidad <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            placeholder="Ej. 30"
                            min="1"
                            value={formData.capacity}
                            onChange={(e) => onFormChange({ ...formData, capacity: e.target.value })}
                            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-medium text-black outline-none transition focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        />
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
                        {isLoading ? 'Creando...' : 'Crear'}
                    </button>
                </div>
            </div>
        </div>
    );
}
