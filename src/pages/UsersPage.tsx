import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import FilterTable from '../components/FilterTable';
import GenericTable from '../components/GenericTable';
import GenericDetailModal from '../components/GenericDetailModal';
import type { DetailField } from '../components/GenericDetailModal';
import UserModal from '../components/UserModal';
import DeactivateUserModal from '../components/DeactivateUserModal';
import apiService from '../services/api';
import { registrationService } from '../services/RegistrationService';
import { careerService } from '../services/CareerService';

interface User {
    id: string;
    code: string;
    email: string;
    role: string;
    is_active: boolean;
    profile?: {
        first_name?: string;
        last_name?: string;
        identification?: string;
        phone?: string;
        specialty?: string;
    };
    created_at?: string;
    career?: {
        id?: string;
        name?: string;
    };
}

interface TableUser extends Record<string, any> {
    id: string;
    code: string;
    name: string;
    email: string;
    role: string;
    career: string;
    created_at: string;
    is_active: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [careers, setCareers] = useState<any[]>([]);
    const [tableData, setTableData] = useState<TableUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [editUserId, setEditUserId] = useState<string>('');
    const [deactivateUser, setDeactivateUser] = useState<User | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [filteredTableData, setFilteredTableData] = useState<TableUser[]>([]);
    const [filters, setFilters] = useState<Record<string, string>>({});

    const columns = [
        { key: 'code', label: 'Código' },
        { key: 'name', label: 'Nombre' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Rol' },
        { key: 'career', label: 'Carrera' },
        { key: 'created_at', label: 'Fecha Creación' },
        { key: 'is_active', label: 'Estado' }
    ];

    const actions = [
        { name: 'view', label: 'Ver' },
        { name: 'edit', label: 'Editar' },
        { name: 'deactivate', label: 'Desactivar' },
    ];

    const filterOptions: any[] = [
        { id: 'code', label: 'Código', type: 'text' as const },
        {
            id: 'carrera',
            label: 'Carrera',
            type: 'select' as const,
            options: careers.length > 0
                ? careers.map(c => ({ value: c.id, label: c.name }))
                : [{ value: '', label: 'Cargando carreras...' }]
        },
        {
            id: 'role', label: 'Rol', type: 'select' as const, options: [
                { value: 'STUDENT', label: 'Estudiante' },
                { value: 'TEACHER', label: 'Docente' },
            ]
        },
        {
            id: 'is_active', label: 'Estado', type: 'select' as const, options: [
                { value: 'true', label: '✅ Activo' },
                { value: 'false', label: '🚫 Inactivo' },
            ]
        },
    ];

    useEffect(() => {
        loadCareers();
        loadUsers();
    }, []);

    const loadCareers = async () => {
        try {
            const allCareers = await careerService.getCareers();
            setCareers(allCareers);
        } catch (error) {
            console.error('Error al cargar carreras:', error);
        }
    };

    useEffect(() => {
        applyFilters();
    }, [tableData, filters]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const response = await apiService.get<any>('/users/');

            if (response.data && Array.isArray(response.data)) {
                const usersWithCareers = await Promise.all(
                    response.data.map(async (user: User) => {
                        if (user.role === 'STUDENT') {
                            if (!user.career || !user.career.name) {
                                try {
                                    const studentProfileId = (user.profile as any)?.id;
                                    if (studentProfileId) {
                                        const registrations = await registrationService.getRegistrationsByStudent(studentProfileId);
                                        if (registrations.length > 0 && (registrations[0] as any).career_id) {
                                            const career = await careerService.getCareerById((registrations[0] as any).career_id);
                                            if (career) {
                                                user.career = { id: (career as any).id, name: (career as any).name };
                                            }
                                        }
                                    }
                                } catch (err) {
                                    console.error('Error obteniendo carrera:', err);
                                }
                            }
                        }
                        return user;
                    })
                );

                setUsers(usersWithCareers);
                transformUsersToTable(usersWithCareers);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const transformUsersToTable = (users: User[]) => {
        const transformed: TableUser[] = users.map(user => ({
            id: user.id,
            code: user.code || '',
            name: user.profile?.first_name && user.profile?.last_name
                ? `${user.profile.first_name} ${user.profile.last_name}`
                : user.email,
            email: user.email || '',
            role: getRoleLabel(user.role),
            career: user.career?.name ?? '-',
            is_active: user.is_active ? '✅ Activo' : '🚫 Inactivo',
            created_at: formatDate(user.created_at),
        }));
        setTableData(transformed);
    };

    const applyFilters = () => {
        let filtered = tableData;

        if (filters.code) {
            filtered = filtered.filter(u =>
                u.code?.toLowerCase().includes(filters.code.toLowerCase())
            );
        }

        if (filters.carrera) {
            const selectedCareer = careers.find(c => c.id === filters.carrera);
            if (selectedCareer) {
                filtered = filtered.filter(u =>
                    u.career?.toLowerCase().includes(selectedCareer.name.toLowerCase())
                );
            }
        }

        if (filters.role) {
            const roleLabel = getRoleLabel(filters.role);
            filtered = filtered.filter(u => u.role === roleLabel);
        }

        if (filters.is_active) {
            const isActive = filters.is_active === 'true' ? '✅ Activo' : '🚫 Inactivo';
            filtered = filtered.filter(u => u.is_active === isActive);
        }

        setFilteredTableData(filtered);
    };

    const handleFilterChange = (newFilters: Record<string, string>) => {
        setFilters(newFilters);
    };

    const handleAction = (name: string, item: Record<string, any>) => {
        const userId = item.id;
        const user = users.find(u => u.id === userId);

        switch (name) {
            case 'view':
                if (user) {
                    setSelectedUser(user);
                    setIsDetailModalOpen(true);
                }
                break;
            case 'edit':
                setEditUserId(userId);
                setIsEditModalOpen(true);
                break;
            case 'deactivate':
                if (user) {
                    setDeactivateUser(user);
                    setIsDeactivateModalOpen(true);
                }
                break;
            default:
                break;
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'TEACHER': return 'Docente';
            case 'STUDENT': return 'Estudiante';
            default: return role;
        }
    };

    const formatDate = (date?: string) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <PageHeader
                title="Usuarios"
                description="Gestiona estudiantes y docentes"
                primaryAction={{
                    label: 'Agregar Usuario',
                    onClick: () => setIsCreateModalOpen(true),
                }}
            />

            <FilterTable filters={filterOptions} onFilterChange={handleFilterChange} />

            {loading ? (
                <div className="rounded-lg border border-gray-300 bg-white p-6 text-center shadow-default dark:border-strokedark dark:bg-boxdark">
                    <p className="text-gray-600 dark:text-gray-400">Cargando usuarios...</p>
                </div>
            ) : filteredTableData.length === 0 ? (
                <div className="rounded-lg border border-gray-300 bg-white p-6 text-center shadow-default dark:border-strokedark dark:bg-boxdark">
                    <p className="text-gray-600 dark:text-gray-400">No se encontraron usuarios</p>
                </div>
            ) : (
                <GenericTable
                    data={filteredTableData}
                    columns={columns}
                    actions={actions}
                    onAction={handleAction}
                />
            )}

            {filteredTableData.length > 0 && (
                <div className="mt-4 rounded-lg border border-gray-300 bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Mostrando {filteredTableData.length} de {tableData.length} usuarios
                    </p>
                </div>
            )}

            {/* Modal crear usuario */}
            <UserModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    setIsCreateModalOpen(false);
                    loadUsers();
                }}
                mode="create"
            />

            {/* Modal editar usuario */}
            <UserModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditUserId('');
                }}
                onSuccess={() => {
                    setIsEditModalOpen(false);
                    setEditUserId('');
                    loadUsers();
                }}
                mode="edit"
                userId={editUserId || undefined}
            />

            {/* Modal desactivar/activar usuario */}
            <DeactivateUserModal
                isOpen={isDeactivateModalOpen}
                onClose={() => {
                    setIsDeactivateModalOpen(false);
                    setDeactivateUser(null);
                }}
                onSuccess={(newIsActive) => {
                    setUsers(prevUsers =>
                        prevUsers.map(u =>
                            u.id === deactivateUser?.id
                                ? { ...u, is_active: newIsActive }
                                : u
                        )
                    );
                    setTableData(prevData =>
                        prevData.map(row =>
                            row.id === deactivateUser?.id
                                ? { ...row, is_active: newIsActive ? '✅ Activo' : '🚫 Inactivo' }
                                : row
                        )
                    );
                    setDeactivateUser(null);
                }}
                userId={deactivateUser?.id}
            />

            {/* Modal detalle usuario */}
            {selectedUser && (
                <GenericDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={() => {
                        setIsDetailModalOpen(false);
                        setSelectedUser(null);
                    }}
                    title={`Detalles del ${selectedUser.role === 'STUDENT' ? 'Estudiante' : selectedUser.role === 'TEACHER' ? 'Docente' : 'Usuario'}`}
                    fields={[
                        ...(selectedUser.profile?.identification ? [{ label: 'Cédula', value: selectedUser.profile.identification }] : []),
                        ...(selectedUser.profile?.first_name ? [{ label: 'Nombre', value: selectedUser.profile.first_name }] : []),
                        ...(selectedUser.profile?.last_name ? [{ label: 'Apellido', value: selectedUser.profile.last_name }] : []),
                        { label: 'Código', value: selectedUser.code },
                        { label: 'Rol', value: getRoleLabel(selectedUser.role) },
                        { label: 'Correo', value: selectedUser.email },
                        ...(selectedUser.role === 'TEACHER' && selectedUser.profile?.specialty ? [{ label: 'Especialidad', value: selectedUser.profile.specialty }] : []),
                        ...(selectedUser.role === 'TEACHER' && selectedUser.profile?.phone ? [{ label: 'Teléfono', value: selectedUser.profile.phone }] : []),
                        ...(selectedUser.role === 'STUDENT' && selectedUser.career?.name ? [{ label: 'Carrera', value: selectedUser.career.name }] : []),
                        {
                            label: 'Estado',
                            value: selectedUser.is_active ? '✅ Activo' : '🚫 Inactivo',
                            color: selectedUser.is_active ? 'text-green-600' : 'text-red-600',
                        },
                        { label: 'Fecha de Creación', value: formatDate(selectedUser.created_at) },
                    ] as DetailField[]}
                />
            )}
        </div>
    );
}