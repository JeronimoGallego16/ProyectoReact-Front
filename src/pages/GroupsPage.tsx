import { useState, useEffect } from 'react';
import FilterTable from './FilterTable';
import { groupService } from '../services/GroupService';
import { subjectService } from '../services/SubjectService';
import teacherService from '../services/teacher.service';
import { toast } from 'react-hot-toast';
import { Group } from '../models/Group';

interface GroupWithDetails extends Group {
    code: string;
    name: string;
    capacity: number;
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

    const filterOptions: FilterOptionType[] = [
        { id: 'code', label: 'Código Grupo', placeholder: 'Buscar por código...' },
        { id: 'name', label: 'Nombre Grupo', placeholder: 'Buscar por nombre...' },
        { id: 'subject_id', label: 'Asignatura', placeholder: 'Seleccionar asignatura...' },
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const groupsRes = await groupService.getGroups();
                const subjectsRes = await subjectService.getSubjects();
                const teachersRes = await teacherService.getAllTeachers();

                // Mapear respuestas al tipo correcto
                setGroupsData((groupsRes as GroupWithDetails[]) || []);
                setSubjectsData(subjectsRes || []);
                setTeachersData((teachersRes?.data || teachersRes) as Teacher[] || []);
            } catch (error) {
                console.error('Error cargando datos:', error);
                toast.error('Error cargando los datos');
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
        return (
            (!filters.code || group.code?.toLowerCase().includes(filters.code.toLowerCase())) &&
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
                <button
                    className="rounded-lg !bg-blue-700 px-6 py-2.5 font-medium !text-white hover:!bg-blue-800 transition shadow-md"
                >
                    ➕ Asignar Docente
                </button>
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
                                    <td className="px-4 py-5 text-sm text-black dark:text-white">{group.code}</td>
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
                                    <td className="px-4 py-5 text-sm">
                                        <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
                                            ✏️ Asignar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}