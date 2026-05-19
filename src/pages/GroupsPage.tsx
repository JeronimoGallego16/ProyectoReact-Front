import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import FilterTable from '../components/FilterTable';
import GenericTable from '../components/GenericTable';
import ModalLauncher from '../components/ModalLauncher';
import { groupService } from '../services/GroupService';
import { subjectService } from '../services/SubjectService';
import { semesterService } from '../services/SemesterService';
import teacherService from '../services/teacher.service';
import TeacherAGroupService from '../services/TeacherAGroupService';
import { toast } from 'react-hot-toast';
import { GroupWithDetails, FilterOptionType } from '../models/Group';
import { Subject, TeacherData } from '../models/Subject';

export default function GroupsPage() {
    const [groupsData, setGroupsData] = useState<GroupWithDetails[]>([]);
    const [tableData, setTableData] = useState<Record<string, any>[]>([]);
    const [subjectsData, setSubjectsData] = useState<Subject[]>([]);
    const [teachersData, setTeachersData] = useState<TeacherData[]>([]);
    const [semestersData, setSemestersData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [filteredTableData, setFilteredTableData] = useState<Record<string, any>[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<GroupWithDetails | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<string>('');
    const [selectedGroup2, setSelectedGroup2] = useState<string>('');
    const [selectedSemesterAssign, setSelectedSemesterAssign] = useState<string>('');
    const [isAssigning, setIsAssigning] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingGroupId, setEditingGroupId] = useState<string>('');
    const [createFormData, setCreateFormData] = useState({
        groupCode: '',
        groupName: '',
        subjectId: '',
        semesterId: '',
        teacherId: '',
        capacity: '',
    });
    const [editFormData, setEditFormData] = useState({
        groupCode: '',
        groupName: '',
        subjectId: '',
        semesterId: '',
        teacherId: '',
        capacity: '',
    });

    const columns = [
        { key: 'group_code', label: 'Código Grupo' },
        { key: 'name', label: 'Nombre Grupo' },
        { key: 'subject_name', label: 'Asignatura' },
        { key: 'subject_code', label: 'Código Asignatura' },
        { key: 'semester_name', label: 'Semestre' },
        { key: 'capacity', label: 'Cupos' },
        { key: 'teacher_name', label: 'Docente' },
    ];

    const actions = [
        { name: 'view', label: 'Ver' },
        { name: 'edit', label: 'Editar' },
        { name: 'assign', label: 'Asignar Docente' },
    ];

    const filterOptions: FilterOptionType[] = [
        { id: 'code', label: 'Código Grupo', placeholder: 'Buscar por código...' },
        { id: 'name', label: 'Nombre Grupo', placeholder: 'Buscar por nombre...' },
        { id: 'subject_id', label: 'Asignatura', placeholder: 'Seleccionar asignatura...' },
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [groupsRes, subjectsRes, teachersRes, semestersRes] = await Promise.all([
                    groupService.getGroups(),
                    subjectService.getSubjects(),
                    teacherService.getAllTeachers(),
                    semesterService.getSemesters()
                ]);

                // Mapear respuestas al tipo correcto
                setGroupsData((groupsRes as GroupWithDetails[]) || []);
                setSubjectsData(subjectsRes || []);
                setSemestersData(semestersRes || []);

                // Extrae los docentes - teachersRes devuelve { success, data: [...] } desde /academic/teachers/search
                const teachers: TeacherData[] = [];
                const teacherArray = Array.isArray(teachersRes) ? teachersRes : (teachersRes?.data || []);
                if (Array.isArray(teacherArray)) {
                    teachers.push(...teacherArray.map((t: any) => ({
                        id: t.id,  // ✅ usa siempre el id del perfil
                        name: `${t.first_name || ''} ${t.last_name || ''}`.trim(),
                    })));
                }
                setTeachersData(teachers);
                transformGroupsToTable((groupsRes as GroupWithDetails[]) || [], subjectsRes || [], semestersRes || [], teachers);
            } catch (error) {
                console.error('Error cargando datos:', error);
                toast.error('Error cargando los datos');
                setTeachersData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const transformGroupsToTable = (groups: GroupWithDetails[], subjects: Subject[], semesters: any[], teachers: TeacherData[]) => {
        const transformed: Record<string, any>[] = groups.map(group => {
            const subjectName = subjectService.findSubjectName(group.subject_id, subjects);
            const subjectCode = subjectService.findSubjectCode(group.subject_id, subjects);
            const semesterName = semesterService.findSemesterName(group.semester_id, semesters);
            const teacherName = teacherService.findTeacherName(group.teacher_id, teachers);

            return {
                id: group.id,
                group_code: group.group_code || group.code || '',
                name: group.name || '',
                subject_name: subjectName,
                subject_code: subjectCode,
                semester_name: semesterName,
                capacity: group.capacity,
                teacher_name: teacherName,
                subject_id: group.subject_id,
                semester_id: group.semester_id,
                teacher_id: group.teacher_id,
            };
        });
        setTableData(transformed);
    };

    useEffect(() => {
        applyFilters();
    }, [tableData, filters]);

    const applyFilters = () => {
        let filtered = tableData;

        if (filters.code) {
            filtered = filtered.filter(g =>
                g.group_code?.toLowerCase().includes(filters.code.toLowerCase())
            );
        }

        if (filters.name) {
            filtered = filtered.filter(g =>
                g.name?.toLowerCase().includes(filters.name.toLowerCase())
            );
        }

        if (filters.subject_id) {
            filtered = filtered.filter(g => g.subject_id === filters.subject_id);
        }

        setFilteredTableData(filtered);
    };

    const handleAssignTeacher = async () => {
        if (!selectedTeacher || !selectedGroup2 || !selectedSemesterAssign) {
            toast.error('Por favor selecciona un docente, un grupo y un semestre');
            return;
        }

        setIsAssigning(true);
        try {
            // Obtener datos del grupo seleccionado
            const group = groupsData.find(g => g.id === selectedGroup2);
            if (!group) {
                toast.error('Grupo no encontrado');
                return;
            }

            // Validar que el semestre seleccionado esté activo
            if (!await semesterService.isSemesterActive(selectedSemesterAssign)) {
                toast.error('No se puede asignar un docente en un semestre inactivo');
                setIsAssigning(false);
                return;
            }

            const result = await TeacherAGroupService.assignTeacherToGroup({
                semesterId: selectedSemesterAssign,
                groupId: selectedGroup2,
                teacherId: selectedTeacher,
            });

            if (result.success) {
                toast.success(result.message || 'Docente asignado correctamente');
                // Actualizar solo la lista de grupos (como hacía el archivo viejo)
                const groupsRes = await groupService.getGroups();
                setGroupsData((groupsRes as GroupWithDetails[]) || []);
                transformGroupsToTable((groupsRes as GroupWithDetails[]) || [], subjectsData, semestersData, teachersData);
                setShowAssignModal(false);
                setSelectedTeacher('');
                setSelectedGroup2('');
                setSelectedSemesterAssign('');
            } else {
                toast.error(result.error || 'Error al asignar el docente');
            }
        } catch (error) {
            console.error('Error asignando docente:', error);
            toast.error('Error al asignar el docente');
        } finally {
            setIsAssigning(false);
        }
    };

    const handleFilterChange = (newFilters: Record<string, string>) => {
        setFilters(newFilters);
    };

    const handleAction = (name: string, item: Record<string, any>) => {
        const groupId = item.id;
        const group = groupsData.find(g => g.id === groupId);

        switch (name) {
            case 'view':
                if (group) {
                    setSelectedGroup(group);
                    setIsDetailModalOpen(true);
                }
                break;
            case 'edit':
                handleOpenEditModal(group!);
                break;
            case 'assign':
                setSelectedGroup2(groupId);
                setShowAssignModal(true);
                break;
            default:
                break;
        }
    };

    const handleCreateGroup = async () => {
        if (!createFormData.groupCode || !createFormData.groupName || !createFormData.subjectId || !createFormData.semesterId || !createFormData.teacherId || !createFormData.capacity) {
            toast.error('Por favor completa todos los campos');
            return;
        }

        setIsCreating(true);
        try {
            const result = await groupService.createGroup({
                group_code: createFormData.groupCode,
                name: createFormData.groupName,
                subject_id: createFormData.subjectId,
                semester_id: createFormData.semesterId,
                capacity: parseInt(createFormData.capacity),
                teacher_id: createFormData.teacherId,
            });

            if (result) {
                toast.success('Grupo creado correctamente');
                // Actualizar la lista de grupos
                const groupsRes = await groupService.getGroups();
                setGroupsData((groupsRes as GroupWithDetails[]) || []);
                transformGroupsToTable((groupsRes as GroupWithDetails[]) || [], subjectsData, semestersData, teachersData);
                setShowCreateModal(false);
                setCreateFormData({
                    groupCode: '',
                    groupName: '',
                    subjectId: '',
                    semesterId: '',
                    teacherId: '',
                    capacity: '',
                });
            } else {
                toast.error('Error al crear el grupo');
            }
        } catch (error) {
            console.error('Error creando grupo:', error);
            toast.error('Error al crear el grupo');
        } finally {
            setIsCreating(false);
        }

        console.log('Datos a enviar:', {
            group_code: createFormData.groupCode,
            name: createFormData.groupName,
            subject_id: createFormData.subjectId,
            semester_id: createFormData.semesterId,
            capacity: parseInt(createFormData.capacity),
            teacher_id: createFormData.teacherId,
        });
    };

    const handleOpenEditModal = (group: GroupWithDetails) => {
        setEditingGroupId(group.id);
        setEditFormData({
            groupCode: group.code || '',
            groupName: group.name || '',
            subjectId: group.subject_id || '',
            semesterId: group.semester_id || '',
            teacherId: group.teacher_id || '',
            capacity: group.capacity.toString() || '',
        });
        setShowEditModal(true);
    };

    const handleEditGroup = async () => {
        if (!editFormData.groupCode || !editFormData.groupName || !editFormData.subjectId || !editFormData.semesterId || !editFormData.teacherId || !editFormData.capacity) {
            toast.error('Por favor completa todos los campos');
            return;
        }

        setIsEditing(true);
        try {
            const result = await groupService.updateGroup(editingGroupId, {
                group_code: editFormData.groupCode,
                name: editFormData.groupName,
                subject_id: editFormData.subjectId,
                semester_id: editFormData.semesterId,
                teacher_id: editFormData.teacherId,
                capacity: parseInt(editFormData.capacity),
            });

            if (result) {
                toast.success('Grupo actualizado correctamente');
                // Actualizar la lista de grupos
                const groupsRes = await groupService.getGroups();
                setGroupsData((groupsRes as GroupWithDetails[]) || []);
                transformGroupsToTable((groupsRes as GroupWithDetails[]) || [], subjectsData, semestersData, teachersData);
                setShowEditModal(false);
                setEditingGroupId('');
                setEditFormData({
                    groupCode: '',
                    groupName: '',
                    subjectId: '',
                    semesterId: '',
                    teacherId: '',
                    capacity: '',
                });
            } else {
                toast.error('Error al actualizar el grupo');
            }
        } catch (error) {
            console.error('Error editando grupo:', error);
            toast.error('Error al actualizar el grupo');
        } finally {
            setIsEditing(false);
        }
    };


    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <PageHeader
                title="Asignar un docente a un grupo"
                description="Administra los grupos de clase y asignación de docentes"
                primaryAction={{
                    label: 'Crear Grupo',
                    onClick: () => setShowCreateModal(true),
                }}
            />

            {/* Filters */}
            <FilterTable filters={filterOptions} onFilterChange={handleFilterChange} />

            {/* Tabla de grupos */}
            {loading ? (
                <div className="rounded-lg border border-gray-300 bg-white p-6 text-center shadow-default dark:border-strokedark dark:bg-boxdark">
                    <p className="text-gray-600 dark:text-gray-400">Cargando grupos...</p>
                </div>
            ) : filteredTableData.length === 0 ? (
                <div className="rounded-lg border border-gray-300 bg-white p-6 text-center shadow-default dark:border-strokedark dark:bg-boxdark">
                    <p className="text-gray-600 dark:text-gray-400">No se encontraron grupos</p>
                </div>
            ) : (
                <GenericTable
                    data={filteredTableData}
                    columns={columns}
                    actions={actions}
                    onAction={handleAction}
                />
            )}

            {/* Información de paginación */}
            {filteredTableData.length > 0 && (
                <div className="mt-4 rounded-lg border border-gray-300 bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Mostrando {filteredTableData.length} de {tableData.length} grupos
                    </p>
                </div>
            )}

            {/* Modal detalle grupo */}
            {selectedGroup && (
                <ModalLauncher
                    isOpen={isDetailModalOpen}
                    onClose={() => {
                        setIsDetailModalOpen(false);
                        setSelectedGroup(null);
                    }}
                >
                    {() => (
                        <div className="space-y-5 p-4">
                            <div>
                                <h3 className="text-xl font-semibold text-black dark:text-white">
                                    Detalles del Grupo
                                </h3>
                                <p className="mt-1 text-sm text-body dark:text-bodydark">
                                    Información completa del grupo.
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {/* Código Grupo */}
                                <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                                    <p className="text-sm font-medium text-body dark:text-bodydark">Código Grupo</p>
                                    <p className="mt-2 text-base text-black dark:text-white">{selectedGroup.group_code || selectedGroup.code || '-'}</p>
                                </div>

                                {/* Nombre Grupo */}
                                <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                                    <p className="text-sm font-medium text-body dark:text-bodydark">Nombre Grupo</p>
                                    <p className="mt-2 text-base text-black dark:text-white">{selectedGroup.name || '-'}</p>
                                </div>

                                {/* Asignatura */}
                                <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                                    <p className="text-sm font-medium text-body dark:text-bodydark">Asignatura</p>
                                    <p className="mt-2 text-base text-black dark:text-white">{subjectService.findSubjectName(selectedGroup.subject_id, subjectsData)}</p>
                                </div>

                                {/* Código Asignatura */}
                                <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                                    <p className="text-sm font-medium text-body dark:text-bodydark">Código Asignatura</p>
                                    <p className="mt-2 text-base text-black dark:text-white">{subjectService.findSubjectCode(selectedGroup.subject_id, subjectsData)}</p>
                                </div>

                                {/* Semestre */}
                                <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                                    <p className="text-sm font-medium text-body dark:text-bodydark">Semestre</p>
                                    <p className="mt-2 text-base text-black dark:text-white">{semesterService.findSemesterName(selectedGroup.semester_id, semestersData)}</p>
                                </div>

                                {/* Capacidad */}
                                <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                                    <p className="text-sm font-medium text-body dark:text-bodydark">Capacidad</p>
                                    <p className="mt-2 text-base text-black dark:text-white">{selectedGroup.capacity}</p>
                                </div>

                                {/* Docente */}
                                <div className="rounded-md border border-stroke p-4 dark:border-strokedark sm:col-span-2">
                                    <p className="text-sm font-medium text-body dark:text-bodydark">Docente Asignado</p>
                                    <p className="mt-2 text-base text-black dark:text-white">{teacherService.findTeacherName(selectedGroup.teacher_id, teachersData)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </ModalLauncher>
            )}

            {/* Modal Asignar Docente */}
            {showAssignModal && (
                <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="mx-auto my-auto flex w-full max-w-2xl max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-stroke bg-white shadow-2xl dark:border-strokedark dark:bg-boxdark">
                        <div className="border-b border-stroke px-6 py-5 dark:border-strokedark">
                            <h2 className="text-xl font-semibold text-black dark:text-white">
                            Asignar Docente a Grupo
                            </h2>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto p-6.5">
                            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                Grupo Seleccionado
                            </label>
                            <div className="w-full rounded-lg border border-stroke bg-gray-2 px-4 py-3 text-black dark:border-strokedark dark:bg-meta-4 dark:text-white">
                                {groupsData.find(g => g.id === selectedGroup2)?.group_code || groupsData.find(g => g.id === selectedGroup2)?.code} - {groupsData.find(g => g.id === selectedGroup2)?.name}
                            </div>

                            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                Seleccionar Semestre
                            </label>
                            <select
                                value={selectedSemesterAssign}
                                onChange={(e) => setSelectedSemesterAssign(e.target.value)}
                                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-medium text-black outline-none transition focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                            >
                                <option value="">-- Selecciona un semestre --</option>
                                {semestersData.map((semester) => (
                                    <option key={semester.id} value={semester.id}>
                                        {semester.name || semester.codigo}
                                    </option>
                                ))}
                            </select>

                            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                Seleccionar Docente
                            </label>
                            <select
                                value={selectedTeacher}
                                onChange={(e) => setSelectedTeacher(e.target.value)}
                                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-medium text-black outline-none transition focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                            >
                                <option value="">-- Selecciona un docente --</option>
                                {teachersData.map((teacher) => (
                                    <option key={teacher.id} value={teacher.id}>
                                        {teacher.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-3 border-t border-stroke p-6.5 pt-0 dark:border-strokedark">
                            <button
                                onClick={() => {
                                    setShowAssignModal(false);
                                    setSelectedTeacher('');
                                    setSelectedGroup2('');
                                    setSelectedSemesterAssign('');
                                }}
                                disabled={isAssigning}
                                className="flex-1 rounded-md border border-stroke px-4 py-2.5 font-medium text-black transition hover:bg-gray-2 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAssignTeacher}
                                disabled={isAssigning}
                                className="flex-1 rounded-md bg-primary px-4 py-2.5 font-medium text-white transition hover:bg-opacity-90 disabled:opacity-50"
                            >
                                {isAssigning ? 'Asignando...' : 'Asignar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Crear Grupo */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="mx-auto my-auto flex w-full max-w-2xl max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-stroke bg-white shadow-2xl dark:border-strokedark dark:bg-boxdark">
                        <div className="border-b border-stroke px-6 py-5 dark:border-strokedark">
                            <h2 className="text-xl font-semibold text-black dark:text-white">
                            Crear Nuevo Grupo
                            </h2>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto p-6.5">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                    Código Grupo <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej. G-A-01"
                                    value={createFormData.groupCode}
                                    onChange={(e) => setCreateFormData({ ...createFormData, groupCode: e.target.value })}
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
                                    value={createFormData.groupName}
                                    onChange={(e) => setCreateFormData({ ...createFormData, groupName: e.target.value })}
                                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-medium text-black outline-none transition focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                    Asignatura <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={createFormData.subjectId}
                                    onChange={(e) => setCreateFormData({ ...createFormData, subjectId: e.target.value })}
                                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-medium text-black outline-none transition focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                >
                                    <option value="">-- Selecciona una asignatura --</option>
                                    {subjectsData.map((subject) => (
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
                                    value={createFormData.semesterId}
                                    onChange={(e) => setCreateFormData({ ...createFormData, semesterId: e.target.value })}
                                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-medium text-black outline-none transition focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                >
                                    <option value="">-- Selecciona un semestre --</option>
                                    {semestersData.map((semester) => (
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
                                    value={createFormData.teacherId}
                                    onChange={(e) => setCreateFormData({ ...createFormData, teacherId: e.target.value })}
                                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-medium text-black outline-none transition focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                >
                                    <option value="">-- Selecciona un docente --</option>
                                    {teachersData.map((teacher) => (
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
                                    value={createFormData.capacity}
                                    onChange={(e) => setCreateFormData({ ...createFormData, capacity: e.target.value })}
                                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-medium text-black outline-none transition focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 border-t border-stroke p-6.5 pt-0 dark:border-strokedark">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setCreateFormData({
                                        groupCode: '',
                                        groupName: '',
                                        subjectId: '',
                                        semesterId: '',
                                        teacherId: '',
                                        capacity: '',
                                    });
                                }}
                                disabled={isCreating}
                                className="flex-1 rounded-md border border-stroke px-4 py-2.5 font-medium text-black transition hover:bg-gray-2 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateGroup}
                                disabled={isCreating}
                                className="flex-1 rounded-md bg-primary px-4 py-2.5 font-medium text-white transition hover:bg-opacity-90 disabled:opacity-50"
                            >
                                {isCreating ? 'Creando...' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Editar Grupo */}
            {showEditModal && (
                <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="mx-auto my-auto flex w-full max-w-2xl max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-stroke bg-white shadow-2xl dark:border-strokedark dark:bg-boxdark">
                        <div className="border-b border-stroke px-6 py-5 dark:border-strokedark">
                            <h2 className="text-xl font-semibold text-black dark:text-white">
                            Editar Grupo
                            </h2>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto p-6.5">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                    Código Grupo <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej. G-A-01"
                                    value={editFormData.groupCode}
                                    onChange={(e) => setEditFormData({ ...editFormData, groupCode: e.target.value })}
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
                                    value={editFormData.groupName}
                                    onChange={(e) => setEditFormData({ ...editFormData, groupName: e.target.value })}
                                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-medium text-black outline-none transition focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                    Asignatura <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={editFormData.subjectId}
                                    onChange={(e) => setEditFormData({ ...editFormData, subjectId: e.target.value })}
                                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-medium text-black outline-none transition focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                >
                                    <option value="">-- Selecciona una asignatura --</option>
                                    {subjectsData.map((subject) => (
                                        <option key={subject.id} value={subject.id}>
                                            {subject.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                    Semestre <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={editFormData.semesterId}
                                    onChange={(e) => setEditFormData({ ...editFormData, semesterId: e.target.value })}
                                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-medium text-black outline-none transition focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                >
                                    <option value="">-- Selecciona un semestre --</option>
                                    {semestersData.map((semester) => (
                                        <option key={semester.id} value={semester.id}>
                                            {semester.name || semester.id}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                    Docente <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={editFormData.teacherId}
                                    onChange={(e) => setEditFormData({ ...editFormData, teacherId: e.target.value })}
                                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-medium text-black outline-none transition focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                >
                                    <option value="">-- Selecciona un docente --</option>
                                    {teachersData.map((teacher) => (
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
                                    value={editFormData.capacity}
                                    onChange={(e) => setEditFormData({ ...editFormData, capacity: e.target.value })}
                                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-medium text-black outline-none transition focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 border-t border-stroke p-6.5 pt-0 dark:border-strokedark">
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingGroupId('');
                                    setEditFormData({
                                        groupCode: '',
                                        groupName: '',
                                        subjectId: '',
                                        semesterId: '',
                                        teacherId: '',
                                        capacity: '',
                                    });
                                }}
                                disabled={isEditing}
                                className="flex-1 rounded-md border border-stroke px-4 py-2.5 font-medium text-black transition hover:bg-gray-2 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleEditGroup}
                                disabled={isEditing}
                                className="flex-1 rounded-md bg-primary px-4 py-2.5 font-medium text-white transition hover:bg-opacity-90 disabled:opacity-50"
                            >
                                {isEditing ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}