import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import FilterTable from '../components/FilterTable';
import GenericTable from '../components/GenericTable';
import GenericFormModal from '../components/GenericFormModal';
import GenericDetailModal from '../components/GenericDetailModal';
import GenericStatusModal from '../components/GenericStatusModal';
import { groupService } from '../services/GroupService';
import { subjectService } from '../services/SubjectService';
import { semesterService } from '../services/SemesterService';
import teacherService from '../services/teacher.service';
import TeacherAGroupService from '../services/TeacherAGroupService';
import { toast } from 'react-hot-toast';
import { GroupWithDetails, FilterOptionType } from '../models/Group';
import { Subject, TeacherData } from '../models/Subject';
import { usePageModals } from '../hooks/usePageModals';

export default function GroupsPage() {
    const modals = usePageModals();
    const [groupsData, setGroupsData] = useState<GroupWithDetails[]>([]);
    const [tableData, setTableData] = useState<Record<string, any>[]>([]);
    const [subjectsData, setSubjectsData] = useState<Subject[]>([]);
    const [teachersData, setTeachersData] = useState<TeacherData[]>([]);
    const [semestersData, setSemestersData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [filteredTableData, setFilteredTableData] = useState<Record<string, any>[]>([]);
    const [crudMode, setCrudMode] = useState<'create' | 'edit' | null>(null);
    const [selectedTeacher, setSelectedTeacher] = useState<string>('');
    const [selectedSemesterAssign, setSelectedSemesterAssign] = useState<string>('');
    const [isAssigning, setIsAssigning] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
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
        if (!selectedTeacher || !modals.selectedItem?.id || !selectedSemesterAssign) {
            toast.error('Por favor selecciona un docente, un grupo y un semestre');
            return;
        }

        setIsAssigning(true);
        try {
            const group = groupsData.find(g => g.id === modals.selectedItem.id);
            if (!group) {
                toast.error('Grupo no encontrado');
                return;
            }

            if (!await semesterService.isSemesterActive(selectedSemesterAssign)) {
                toast.error('No se puede asignar un docente en un semestre inactivo');
                return;
            }

            // Validar que el docente seleccionado esté activo
            const selectedTeacherData = teachersData.find(t => t.id === selectedTeacher);
            if (!selectedTeacherData || !selectedTeacherData.is_active) {
                toast.error('No se puede asignar un docente desactivado');
                setIsAssigning(false);
                return;
            }

            const result = await TeacherAGroupService.assignTeacherToGroup({
                semesterId: selectedSemesterAssign,
                groupId: modals.selectedItem.id,
                teacherId: selectedTeacher,
            });

            if (result.success) {
                toast.success(result.message || 'Docente asignado correctamente');
                const groupsRes = await groupService.getGroups();
                setGroupsData((groupsRes as GroupWithDetails[]) || []);
                transformGroupsToTable((groupsRes as GroupWithDetails[]) || [], subjectsData, semestersData, teachersData);
                modals.setIsStatusOpen(false);
                setSelectedTeacher('');
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
        const group = groupsData.find(g => g.id === item.id);
        if (!group) return;

        switch (name) {
            case 'view':
                modals.setSelectedItem(group);
                modals.setIsDetailOpen(true);
                break;
            case 'edit':
                modals.setSelectedItem(group);
                setFormData({
                    groupCode: group.code || '',
                    groupName: group.name || '',
                    subjectId: group.subject_id || '',
                    semesterId: group.semester_id || '',
                    teacherId: group.teacher_id || '',
                    capacity: group.capacity.toString() || '',
                });
                setCrudMode('edit');
                modals.setIsEditOpen(true);
                break;
            case 'assign':
                modals.setSelectedItem(group);
                modals.setIsStatusOpen(true);
                break;
            default:
                break;
        }
    };

    const handleCreateGroup = async () => {
        if (!formData.groupCode || !formData.groupName || !formData.subjectId || !formData.semesterId || !formData.teacherId || !formData.capacity) {
            toast.error('Por favor completa todos los campos');
            return;
        }

        // Validar que el docente seleccionado esté activo
        const selectedTeacherData = teachersData.find(t => t.id === formData.teacherId);
        if (!selectedTeacherData || !selectedTeacherData.is_active) {
            toast.error('No se puede asignar un docente desactivado');
            return;
        }

        setIsLoading(true);
        try {
            const result = await groupService.createGroup({
                group_code: formData.groupCode,
                name: formData.groupName,
                subject_id: formData.subjectId,
                semester_id: formData.semesterId,
                capacity: parseInt(formData.capacity),
                teacher_id: formData.teacherId,
            });

            if (result) {
                toast.success('Grupo creado correctamente');
                const groupsRes = await groupService.getGroups();
                setGroupsData((groupsRes as GroupWithDetails[]) || []);
                transformGroupsToTable((groupsRes as GroupWithDetails[]) || [], subjectsData, semestersData, teachersData);
                modals.setIsCreateOpen(false);
                resetForm();
            } else {
                toast.error('Error al crear el grupo');
            }
        } catch (error) {
            console.error('Error creando grupo:', error);
            toast.error('Error al crear el grupo');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditGroup = async () => {
        if (!formData.groupCode || !formData.groupName || !formData.subjectId || !formData.semesterId || !formData.teacherId || !formData.capacity) {
            toast.error('Por favor completa todos los campos');
            return;
        }

        // Validar que el docente seleccionado esté activo
        const selectedTeacherData = teachersData.find(t => t.id === formData.teacherId);
        if (!selectedTeacherData || !selectedTeacherData.is_active) {
            toast.error('No se puede asignar un docente desactivado');
            return;
        }

        setIsLoading(true);
        try {
            const result = await groupService.updateGroup(modals.selectedItem.id, {
                group_code: formData.groupCode,
                name: formData.groupName,
                subject_id: formData.subjectId,
                semester_id: formData.semesterId,
                teacher_id: formData.teacherId,
                capacity: parseInt(formData.capacity),
            });

            if (result) {
                toast.success('Grupo actualizado correctamente');
                const groupsRes = await groupService.getGroups();
                setGroupsData((groupsRes as GroupWithDetails[]) || []);
                transformGroupsToTable((groupsRes as GroupWithDetails[]) || [], subjectsData, semestersData, teachersData);
                modals.setIsEditOpen(false);
                resetForm();
            } else {
                toast.error('Error al actualizar el grupo');
            }
        } catch (error) {
            console.error('Error editando grupo:', error);
            toast.error('Error al actualizar el grupo');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            groupCode: '',
            groupName: '',
            subjectId: '',
            semesterId: '',
            teacherId: '',
            capacity: '',
        });
        modals.setSelectedItem(null);
        setCrudMode(null);
    };


    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <PageHeader
                title="Asignar un docente a un grupo"
                description="Administra los grupos de clase y asignación de docentes"
                primaryAction={{
                    label: 'Crear Grupo',
                    onClick: () => {
                        setCrudMode('create');
                        modals.setIsCreateOpen(true);
                    },
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

            {/* Modal Detail */}
            {modals.selectedItem && (
                <GenericDetailModal
                    isOpen={modals.isDetailOpen}
                    onClose={() => modals.closeAll()}
                    title="Detalles del Grupo"
                    fields={[
                        { label: 'Código Grupo', value: modals.selectedItem.group_code || modals.selectedItem.code || '-' },
                        { label: 'Nombre Grupo', value: modals.selectedItem.name || '-' },
                        { label: 'Asignatura', value: subjectService.findSubjectName(modals.selectedItem.subject_id, subjectsData) },
                        { label: 'Código Asignatura', value: subjectService.findSubjectCode(modals.selectedItem.subject_id, subjectsData) },
                        { label: 'Semestre', value: semesterService.findSemesterName(modals.selectedItem.semester_id, semestersData) },
                        { label: 'Capacidad', value: modals.selectedItem.capacity },
                        { label: 'Docente Asignado', value: teacherService.findTeacherName(modals.selectedItem.teacher_id, teachersData) },
                    ]}
                />
            )}

            {/* Modal Form (Create/Edit) */}
            {modals.isCreateOpen || modals.isEditOpen ? (
                <GenericFormModal
                    isOpen={modals.isCreateOpen || modals.isEditOpen}
                    onClose={() => {
                        modals.closeAll();
                        resetForm();
                    }}
                    onSave={crudMode === 'create' ? handleCreateGroup : handleEditGroup}
                    title={crudMode === 'create' ? 'Crear Nuevo Grupo' : 'Editar Grupo'}
                    isLoading={isLoading}
                    fields={[
                        {
                            id: 'groupCode',
                            label: 'Código Grupo',
                            type: 'text',
                            placeholder: 'Ej. G-A-01',
                            value: formData.groupCode,
                            onChange: (v) => setFormData({ ...formData, groupCode: v }),
                            required: true,
                        },
                        {
                            id: 'groupName',
                            label: 'Nombre Grupo',
                            type: 'text',
                            placeholder: 'Ej. Grupo A',
                            value: formData.groupName,
                            onChange: (v) => setFormData({ ...formData, groupName: v }),
                            required: true,
                        },
                        {
                            id: 'subjectId',
                            label: 'Asignatura',
                            type: 'select',
                            value: formData.subjectId,
                            onChange: (v) => setFormData({ ...formData, subjectId: v }),
                            options: subjectsData.map(s => ({ value: s.id, label: `${s.code} - ${s.name}` })),
                            required: true,
                        },
                        {
                            id: 'semesterId',
                            label: 'Semestre',
                            type: 'select',
                            value: formData.semesterId,
                            onChange: (v) => setFormData({ ...formData, semesterId: v }),
                            options: semestersData.map(s => ({ value: s.id, label: s.name })),
                            required: true,
                        },
                        {
                            id: 'teacherId',
                            label: 'Docente',
                            type: 'select',
                            value: formData.teacherId,
                            onChange: (v) => setFormData({ ...formData, teacherId: v }),
                            options: teachersData
                                .filter(t => t.is_active !== false)
                                .map(t => ({ value: t.id, label: t.name })),
                            required: true,
                        },
                        {
                            id: 'capacity',
                            label: 'Capacidad',
                            type: 'number',
                            placeholder: 'Ej. 30',
                            value: formData.capacity,
                            onChange: (v) => setFormData({ ...formData, capacity: v }),
                            required: true,
                        },
                    ]}
                />
            ) : null}

            {/* Modal Assign Teacher */}
            {modals.selectedItem && (
                <GenericStatusModal
                    isOpen={modals.isStatusOpen}
                    onClose={() => modals.closeAll()}
                    onConfirm={handleAssignTeacher}
                    isLoading={isAssigning}
                    title="Asignar Docente a Grupo"
                    message={
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                                    Grupo Seleccionado
                                </label>
                                <div className="bg-gray-2 dark:bg-meta-4 px-4 py-3 rounded-lg">
                                    {modals.selectedItem.group_code || modals.selectedItem.code} - {modals.selectedItem.name}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                                    Seleccionar Semestre
                                </label>
                                <select
                                    value={selectedSemesterAssign}
                                    onChange={(e) => setSelectedSemesterAssign(e.target.value)}
                                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-medium text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                                >
                                    <option value="">-- Selecciona un semestre --</option>
                                    {semestersData.map((semester) => (
                                        <option key={semester.id} value={semester.id}>
                                            {semester.name || semester.codigo}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                                    Seleccionar Docente
                                </label>
                                <select
                                    value={selectedTeacher}
                                    onChange={(e) => setSelectedTeacher(e.target.value)}
                                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-medium text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                                >
                                    <option value="">-- Selecciona un docente --</option>
                                    {teachersData
                                        .filter(t => t.is_active !== false)
                                        .map((teacher) => (
                                            <option key={teacher.id} value={teacher.id}>
                                                {teacher.name}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        </div> as any
                    }
                    itemName={modals.selectedItem.name}
                    currentStatus={true}
                    confirmText="Asignar"
                    cancelText="Cancelar"
                />
            )}
        </div>
    );
}