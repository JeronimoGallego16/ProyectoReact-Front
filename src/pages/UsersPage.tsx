import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import FilterTable from '../components/FilterTable';
import GenericTable from '../components/GenericTable';
import ModalLauncher from '../components/ModalLauncher';
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
    const [deactivateUserId, setDeactivateUserId] = useState<string>('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [filteredTableData, setFilteredTableData] = useState<TableUser[]>([]);
    const [filters, setFilters] = useState<Record<string, string>>({});;

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
            options: careers.length > 0 ? careers.map(c => ({ value: c.id, label: c.name })) : [{ value: '', label: 'Cargando carreras...' }]
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
            // response.data may be processed below; removed empty forEach

            if (response.data && Array.isArray(response.data)) {
                // Los usuarios ya vienen con career desde la API
                // Solo necesitamos enriquecer si falta la carrera para estudiantes
                const usersWithCareers = await Promise.all(
                    response.data.map(async (user) => {
                        if (user.role === 'STUDENT') {

                            if (!user.career || !user.career.name) {
                                try {
                                    // Usar profile.id como student_id en registrations
                                    const studentProfileId = user.profile?.id;
                                    if (studentProfileId) {
                                        const registrations = await registrationService.getRegistrationsByStudent(studentProfileId);

                                        if (registrations.length > 0 && registrations[0].career_id) {

                                            const career = await careerService.getCareerById(registrations[0].career_id);

                                            if (career) {
                                                user.career = { id: career.id, name: career.name };
                                            }
                                        }
                                    }
                                } catch (err) {
                                    console.error(`  ❌ Error obteniendo carrera:`, err);
                                }
                            } else {
                                console.log(`  ✅ Ya tiene carrera: ${user.career.name}`);
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
        const transformed: TableUser[] = users.map(user => {
            const careerDisplay = user.career?.name ? user.career.name : '-';
            return {
                id: user.id,
                code: user.code || '',
                name: user.profile?.first_name && user.profile?.last_name
                    ? `${user.profile.first_name} ${user.profile.last_name}`
                    : user.email,
                email: user.email || '',
                role: getRoleLabel(user.role),
                career: careerDisplay,
                is_active: user.is_active ? '✅ Activo' : '🚫 Inactivo',
                created_at: formatDate(user.created_at),
            };
        });
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
            // El filtro carrera ahora es por ID, buscar por nombre de carrera
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
    };;

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
                setDeactivateUserId(userId);
                setIsDeactivateModalOpen(true);
                break;
            default:
                break;
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'TEACHER':
                return 'Docente';
            case 'STUDENT':
                return 'Estudiante';
            default:
                return role;
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

            {/* Filters */}
            <FilterTable filters={filterOptions} onFilterChange={handleFilterChange} />

            {/* Tabla de usuarios */}
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

            {/* Información de paginación */}
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

            {/* Modal desactivar usuario */}
            <DeactivateUserModal
                isOpen={isDeactivateModalOpen}
                onClose={() => {
                    setIsDeactivateModalOpen(false);
                    setDeactivateUserId('');
                }}
                onSuccess={(newIsActive) => {
                    // Actualizar la tabla localmente
                    setUsers(prevUsers =>
                        prevUsers.map(user =>
                            user.id === deactivateUserId
                                ? { ...user, is_active: newIsActive }
                                : user
                        )
                    );
                    setTableData(prevData =>
                        prevData.map(row =>
                            row.id === deactivateUserId
                                ? { ...row, is_active: newIsActive ? '✅ Activo' : '🚫 Inactivo' }
                                : row
                        )
                    );
                    setIsDeactivateModalOpen(false);
                    setDeactivateUserId('');
                }}
                userId={deactivateUserId || undefined}
            />

            {/* Modal detalle usuario */}
            {selectedUser && (
                <ModalLauncher
                    isOpen={isDetailModalOpen}
                    onClose={() => {
                        setIsDetailModalOpen(false);
                        setSelectedUser(null);
                    }}
                >
                    {() => (
                        <div className="space-y-5 p-4">
                            <div>
                                <h3 className="text-xl font-semibold text-black dark:text-white">
                                    Detalles del {selectedUser.role === 'STUDENT' ? 'Estudiante' : selectedUser.role === 'TEACHER' ? 'Docente' : 'Usuario'}
                                </h3>
                                <p className="mt-1 text-sm text-body dark:text-bodydark">
                                    Información completa del usuario.
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {/* Cédula */}
                                {selectedUser.profile?.identification && (
                                    <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                                        <p className="text-sm font-medium text-body dark:text-bodydark">Cédula</p>
                                        <p className="mt-2 text-base text-black dark:text-white">{selectedUser.profile.identification}</p>
                                    </div>
                                )}

                                {/* Nombre */}
                                {selectedUser.profile?.first_name && (
                                    <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                                        <p className="text-sm font-medium text-body dark:text-bodydark">Nombre</p>
                                        <p className="mt-2 text-base text-black dark:text-white">{selectedUser.profile.first_name}</p>
                                    </div>
                                )}

                                {/* Apellido */}
                                {selectedUser.profile?.last_name && (
                                    <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                                        <p className="text-sm font-medium text-body dark:text-bodydark">Apellido</p>
                                        <p className="mt-2 text-base text-black dark:text-white">{selectedUser.profile.last_name}</p>
                                    </div>
                                )}

                                {/* Código */}
                                <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                                    <p className="text-sm font-medium text-body dark:text-bodydark">Código</p>
                                    <p className="mt-2 text-base text-black dark:text-white">{selectedUser.code}</p>
                                </div>

                                {/* Rol */}
                                <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                                    <p className="text-sm font-medium text-body dark:text-bodydark">Rol</p>
                                    <p className="mt-2 text-base text-black dark:text-white">{getRoleLabel(selectedUser.role)}</p>
                                </div>

                                {/* Correo */}
                                <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                                    <p className="text-sm font-medium text-body dark:text-bodydark">Correo</p>
                                    <p className="mt-2 text-base text-black dark:text-white">{selectedUser.email}</p>
                                </div>

                                {/* Especialidad (solo para TEACHER) */}
                                {selectedUser.role === 'TEACHER' && (
                                    <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                                        <p className="text-sm font-medium text-body dark:text-bodydark">Especialidad</p>
                                        <p className="mt-2 text-base text-black dark:text-white">{selectedUser.profile?.specialty || '-'}</p>
                                    </div>
                                )}

                                {/* Teléfono (solo para TEACHER) */}
                                {selectedUser.role === 'TEACHER' && (
                                    <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                                        <p className="text-sm font-medium text-body dark:text-bodydark">Teléfono</p>
                                        <p className="mt-2 text-base text-black dark:text-white">{selectedUser.profile?.phone || '-'}</p>
                                    </div>
                                )}

                                {/* Carrera/Matrícula (solo para STUDENT) */}
                                {selectedUser.role === 'STUDENT' && selectedUser.career?.name && (
                                    <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                                        <p className="text-sm font-medium text-body dark:text-bodydark">Carrera</p>
                                        <p className="mt-2 text-base text-black dark:text-white">{selectedUser.career.name}</p>
                                    </div>
                                )}

                                {/* Estado */}
                                <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                                    <p className="text-sm font-medium text-body dark:text-bodydark">Estado</p>
                                    <p className="mt-2 text-base text-black dark:text-white">
                                        {selectedUser.is_active ? '✅ Activo' : '🚫 Inactivo'}
                                    </p>
                                </div>

                                {/* Fecha de Creación */}
                                <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                                    <p className="text-sm font-medium text-body dark:text-bodydark">Fecha de Creación</p>
                                    <p className="mt-2 text-base text-black dark:text-white">
                                        {formatDate(selectedUser.created_at)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </ModalLauncher>
            )}
        </div>
    );
}