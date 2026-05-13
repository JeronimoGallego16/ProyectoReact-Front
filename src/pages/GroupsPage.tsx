import { useState, useEffect } from 'react';
import FilterTable from '../components/FilterTable';
import { groupService } from '../services/GroupService';
import { subjectService } from '../services/SubjectService';
import teacherService from '../services/teacher.service';
import TeacherAGroupService from '../services/TeacherAGroupService';
import DeactivateUserModal from '../components/DeactivateUserModal';
import { toast } from 'react-hot-toast';
import { Group } from '../models/Group';

interface GroupWithDetails extends Group {
    group_code?: string;
    code?: string;
    created_at?: string;
}

interface Subject {
    id: string;
    name: string;
    code: string;
}

interface Teacher {
    id: string;
    name: string;
}

interface FilterOptionType {
    id: string;
    label: string;
    placeholder?: string;
}

export default function GroupsPage() {
    const [groupsData, setGroupsData] = useState<GroupWithDetails[]>([]);
    const [subjectsData, setSubjectsData] = useState<Subject[]>([]);
    const [teachersData, setTeachersData] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<string>('');
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [groupToDeactivate, setGroupToDeactivate] = useState<string>('');
    const [isAssigning, setIsAssigning] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingGroupId, setEditingGroupId] = useState<string>('');
    const [createFormData, setCreateFormData] = useState({
        groupCode: '',
        groupName: '',
        subjectId: '',
        semesterId: '',
        capacity: '',
    });
    const [editFormData, setEditFormData] = useState({
        groupCode: '',
        groupName: '',
        capacity: '',
    });

    const filterOptions: FilterOptionType[] = [
        { id: 'code', label: 'Código Grupo', placeholder: 'Buscar por código...' },
        { id: 'name', label: 'Nombre Grupo', placeholder: 'Buscar por nombre...' },
        { id: 'subject_id', label: 'Asignatura', placeholder: 'Seleccionar asignatura...' },
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [groupsRes, subjectsRes, teachersRes] = await Promise.all([
                    groupService.getGroups(),
                    subjectService.getSubjects(),
                    teacherService.getAllTeachers()
                ]);

                // Mapear respuestas al tipo correcto
                setGroupsData((groupsRes as GroupWithDetails[]) || []);
                setSubjectsData(subjectsRes || []);

                // Extrae los docentes - apiService.get() devuelve {success, data: [...]}
                const teachers: Teacher[] = [];
                if (teachersRes?.data && Array.isArray(teachersRes.data)) {
                    teachers.push(...teachersRes.data.map((t: any) => ({
                        id: t.id,
                        name: `${t.profile?.first_name || ''} ${t.profile?.last_name || ''}`.trim() || t.email || t.name || 'Sin nombre',
                    })));
                }
                setTeachersData(teachers);
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

    const handleFilterChange = (filters: Record<string, string>) => {
        setFilters(filters);
    };

    const filteredTableData = groupsData.filter(group => {
        const groupCode = group.group_code || group.code;
        return (
            (!filters.code || groupCode?.toLowerCase().includes(filters.code.toLowerCase())) &&
            (!filters.name || group.name?.toLowerCase().includes(filters.name.toLowerCase())) &&
            (!filters.subject_id || group.subject_id === filters.subject_id)
        );
    });

    const getSubjectName = (subjectId: string) => {
        return subjectsData.find(s => s.id === subjectId)?.name || '-';
    };

    const getSubjectCode = (subjectId: string) => {
        return subjectsData.find(s => s.id === subjectId)?.code || '-';
    };

    const getTeacherName = (teacherId?: string) => {
        if (!teacherId) return 'Sin asignar';
        return teachersData.find(t => t.id === teacherId)?.name || 'Sin asignar';
    };

    const handleAssignTeacher = async () => {
        if (!selectedTeacher || !selectedGroup) {
            toast.error('Por favor selecciona un docente y un grupo');
            return;
        }

        setIsAssigning(true);
        try {
            // Obtener datos del grupo seleccionado
            const group = groupsData.find(g => g.id === selectedGroup);
            if (!group) {
                toast.error('Grupo no encontrado');
                return;
            }

            const result = await TeacherAGroupService.assignTeacherToGroup({
                semesterId: group.semester_id,
                groupId: selectedGroup,
                teacherId: selectedTeacher,
            });

            if (result.success) {
                toast.success(result.message || 'Docente asignado correctamente');
                // Actualizar la lista de grupos
                const groupsRes = await groupService.getGroups();
                setGroupsData((groupsRes as GroupWithDetails[]) || []);
                setShowAssignModal(false);
                setSelectedTeacher('');
                setSelectedGroup('');
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

    const handleCreateGroup = async () => {
        if (!createFormData.groupCode || !createFormData.groupName || !createFormData.subjectId || !createFormData.semesterId || !createFormData.capacity) {
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
                teacher_id: '',
            });

            if (result) {
                toast.success('Grupo creado correctamente');
                // Actualizar la lista de grupos
                const groupsRes = await groupService.getGroups();
                setGroupsData((groupsRes as GroupWithDetails[]) || []);
                setShowCreateModal(false);
                setCreateFormData({
                    groupCode: '',
                    groupName: '',
                    subjectId: '',
                    semesterId: '',
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
    };

    const handleOpenEditModal = (group: GroupWithDetails) => {
        setEditingGroupId(group.id);
        setEditFormData({
            groupCode: group.code || '',
            groupName: group.name || '',
            capacity: group.capacity.toString() || '',
        });
        setShowEditModal(true);
    };

    const handleEditGroup = async () => {
        if (!editFormData.groupCode || !editFormData.groupName || !editFormData.capacity) {
            toast.error('Por favor completa todos los campos');
            return;
        }

        setIsEditing(true);
        try {
            const result = await groupService.updateGroup(editingGroupId, {
                group_code: editFormData.groupCode,
                name: editFormData.groupName,
                capacity: parseInt(editFormData.capacity),
            });

            if (result) {
                toast.success('Grupo actualizado correctamente');
                // Actualizar la lista de grupos
                const groupsRes = await groupService.getGroups();
                setGroupsData((groupsRes as GroupWithDetails[]) || []);
                setShowEditModal(false);
                setEditingGroupId('');
                setEditFormData({
                    groupCode: '',
                    groupName: '',
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

    const handleOpenDeactivateModal = (groupId: string) => {
        setGroupToDeactivate(groupId);
        setShowDeactivateModal(true);
    };

    const handleDeactivateGroupSuccess = async () => {
        try {
            // Actualizar la lista de grupos después de desactivar
            const groupsRes = await groupService.getGroups();
            setGroupsData((groupsRes as GroupWithDetails[]) || []);
            setShowDeactivateModal(false);
            setGroupToDeactivate('');
            toast.success('Grupo desactivado correctamente');
        } catch (error) {
            console.error('Error actualizando grupos:', error);
        }
    };

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-black dark:text-white">
                        📚
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Administra los grupos de clase y docentes
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="rounded-lg !bg-green-700 px-6 py-2.5 font-medium !text-white hover:!bg-green-800 transition shadow-md"
                    >
                        ➕ Crear Grupo
                    </button>
                    <button
                        onClick={() => setShowAssignModal(true)}
                        className="rounded-lg !bg-blue-700 px-6 py-2.5 font-medium !text-white hover:!bg-blue-800 transition shadow-md"
                    >
                        👨‍🏫 Asignar Docente
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6">
                <FilterTable filters={filterOptions} onFilterChange={handleFilterChange} />
            </div>

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
                <div className="overflow-hidden rounded-lg border border-gray-300 shadow-default dark:border-strokedark dark:bg-boxdark">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-meta-4">
                                <th className="px-4 py-5 text-left text-sm font-medium text-black dark:text-white">Código Grupo</th>
                                <th className="px-4 py-5 text-left text-sm font-medium text-black dark:text-white">Nombre Grupo</th>
                                <th className="px-4 py-5 text-left text-sm font-medium text-black dark:text-white">Asignatura</th>
                                <th className="px-4 py-5 text-left text-sm font-medium text-black dark:text-white">Código Asignatura</th>
                                <th className="px-4 py-5 text-left text-sm font-medium text-black dark:text-white">Carrera / Programa</th>
                                <th className="px-4 py-5 text-left text-sm font-medium text-black dark:text-white">Cupos</th>
                                <th className="px-4 py-5 text-left text-sm font-medium text-black dark:text-white">Docente Actual</th>
                                <th className="px-4 py-5 text-left text-sm font-medium text-black dark:text-white">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTableData.map((group, index) => (
                                <tr key={group.id} className={index % 2 === 0 ? 'bg-white dark:bg-boxdark' : 'bg-gray-50 dark:bg-meta-4'}>
                                    <td className="px-4 py-5 text-sm text-black dark:text-white">{group.group_code || group.code}</td>
                                    <td className="px-4 py-5 text-sm text-black dark:text-white">{group.name}</td>
                                    <td className="px-4 py-5 text-sm text-black dark:text-white">{getSubjectName(group.subject_id)}</td>
                                    <td className="px-4 py-5 text-sm text-black dark:text-white">{getSubjectCode(group.subject_id)}</td>
                                    <td className="px-4 py-5 text-sm text-black dark:text-white">-</td>
                                    <td className="px-4 py-5 text-sm text-black dark:text-white">{group.capacity}</td>
                                    <td className="px-4 py-5 text-sm">
                                        <span className={`inline-block rounded px-3 py-1 text-xs font-medium ${group.teacher_id
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                            }`}>
                                            {getTeacherName(group.teacher_id)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-5 text-sm flex gap-2">
                                        <button
                                            onClick={() => handleOpenEditModal(group)}
                                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                        >
                                            ✏️ Editar
                                        </button>
                                        <button
                                            onClick={() => handleOpenDeactivateModal(group.id)}
                                            className="text-red-600 hover:text-red-800 dark:text-red-400"
                                        >
                                            🗑️ Desactivar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Asignar Docente */}
            {showAssignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-boxdark">
                        <h2 className="mb-4 text-xl font-bold text-black dark:text-white">
                            Asignar Docente a Grupo
                        </h2>

                        <div className="mb-4">
                            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                Seleccionar Grupo
                            </label>
                            <select
                                value={selectedGroup}
                                onChange={(e) => setSelectedGroup(e.target.value)}
                                className="w-full rounded border border-gray-300 bg-white px-4 py-2 text-black dark:border-strokedark dark:bg-boxdark dark:text-white"
                            >
                                <option value="">-- Selecciona un grupo --</option>
                                {groupsData.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {group.group_code || group.code} - {group.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-6">
                            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                Seleccionar Docente
                            </label>
                            <select
                                value={selectedTeacher}
                                onChange={(e) => setSelectedTeacher(e.target.value)}
                                className="w-full rounded border border-gray-300 bg-white px-4 py-2 text-black dark:border-strokedark dark:bg-boxdark dark:text-white"
                            >
                                <option value="">-- Selecciona un docente --</option>
                                {teachersData.map((teacher) => (
                                    <option key={teacher.id} value={teacher.id}>
                                        {teacher.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowAssignModal(false);
                                    setSelectedTeacher('');
                                    setSelectedGroup('');
                                }}
                                disabled={isAssigning}
                                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAssignTeacher}
                                disabled={isAssigning}
                                className="flex-1 rounded-lg bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800 disabled:opacity-50"
                            >
                                {isAssigning ? 'Asignando...' : 'Asignar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Crear Grupo */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-boxdark">
                        <h2 className="mb-4 text-xl font-bold text-black dark:text-white">
                            Crear Nuevo Grupo
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                    Código Grupo <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej. G-A-01"
                                    value={createFormData.groupCode}
                                    onChange={(e) => setCreateFormData({ ...createFormData, groupCode: e.target.value })}
                                    className="w-full rounded border border-gray-300 px-4 py-2 text-black dark:border-strokedark dark:bg-boxdark dark:text-white"
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
                                    className="w-full rounded border border-gray-300 px-4 py-2 text-black dark:border-strokedark dark:bg-boxdark dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                    Asignatura <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={createFormData.subjectId}
                                    onChange={(e) => setCreateFormData({ ...createFormData, subjectId: e.target.value })}
                                    className="w-full rounded border border-gray-300 px-4 py-2 text-black dark:border-strokedark dark:bg-boxdark dark:text-white"
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
                                <input
                                    type="text"
                                    placeholder="ID del semestre"
                                    value={createFormData.semesterId}
                                    onChange={(e) => setCreateFormData({ ...createFormData, semesterId: e.target.value })}
                                    className="w-full rounded border border-gray-300 px-4 py-2 text-black dark:border-strokedark dark:bg-boxdark dark:text-white"
                                />
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
                                    className="w-full rounded border border-gray-300 px-4 py-2 text-black dark:border-strokedark dark:bg-boxdark dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setCreateFormData({
                                        groupCode: '',
                                        groupName: '',
                                        subjectId: '',
                                        semesterId: '',
                                        capacity: '',
                                    });
                                }}
                                disabled={isCreating}
                                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateGroup}
                                disabled={isCreating}
                                className="flex-1 rounded-lg bg-green-700 px-4 py-2 font-medium text-white hover:bg-green-800 disabled:opacity-50"
                            >
                                {isCreating ? 'Creando...' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Editar Grupo */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-boxdark">
                        <h2 className="mb-4 text-xl font-bold text-black dark:text-white">
                            Editar Grupo
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                    Código Grupo <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej. G-A-01"
                                    value={editFormData.groupCode}
                                    onChange={(e) => setEditFormData({ ...editFormData, groupCode: e.target.value })}
                                    className="w-full rounded border border-gray-300 px-4 py-2 text-black dark:border-strokedark dark:bg-boxdark dark:text-white"
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
                                    className="w-full rounded border border-gray-300 px-4 py-2 text-black dark:border-strokedark dark:bg-boxdark dark:text-white"
                                />
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
                                    className="w-full rounded border border-gray-300 px-4 py-2 text-black dark:border-strokedark dark:bg-boxdark dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingGroupId('');
                                    setEditFormData({
                                        groupCode: '',
                                        groupName: '',
                                        capacity: '',
                                    });
                                }}
                                disabled={isEditing}
                                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleEditGroup}
                                disabled={isEditing}
                                className="flex-1 rounded-lg bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800 disabled:opacity-50"
                            >
                                {isEditing ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Desactivar Grupo */}
            <DeactivateUserModal
                isOpen={showDeactivateModal}
                onClose={() => {
                    setShowDeactivateModal(false);
                    setGroupToDeactivate('');
                }}
                onSuccess={handleDeactivateGroupSuccess}
                userId={groupToDeactivate}
            />
        </div>
    );
}