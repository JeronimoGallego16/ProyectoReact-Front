import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import FilterTable from '../components/FilterTable';
import InputTable from '../components/InputTable';
import UserModal from '../components/UserModal';
import DeactivateUserModal from '../components/DeactivateUserModal';
import apiService from '../services/api';

interface User {
    id: string;
    code: string;
    email: string;
    role: string;
    is_active: boolean;
    profile?: {
        first_name?: string;
        last_name?: string;
    };
    created_at?: string;
    career?: {
        name?: string;
    };
}

interface TableUser extends Record<string, any> {
    id: string;
    Código: string;
    Nombre: string;
    Email: string;
    Rol: string;
    Carrera: string;
    Estado: string;
    'Fecha creación': string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [tableData, setTableData] = useState<TableUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
    const [editUserId, setEditUserId] = useState<string>('');
    const [deactivateUserId, setDeactivateUserId] = useState<string>('');
    const [filteredTableData, setFilteredTableData] = useState<TableUser[]>([]);
    const [filters, setFilters] = useState<Record<string, string>>({});

    const columns = ['Código', 'Nombre', 'Email', 'Rol', 'Carrera', 'Estado', 'Fecha creación'];
    const actions = [
        { name: 'edit', label: 'Editar' },
        { name: 'deactivate', label: 'Desactivar' },
        { name: 'view', label: 'Ver detalle' },
    ];

    const filterOptions = [
        { id: 'code', label: 'Código', type: 'text' as const },
        { id: 'email', label: 'Email', type: 'text' as const },
        {
            id: 'role', label: 'Rol', type: 'select' as const, options: [
                { value: 'STUDENT', label: 'Estudiante' },
                { value: 'TEACHER', label: 'Docente' },
                { value: 'ADMIN', label: 'Administrador' },
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
        loadUsers();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [tableData, filters]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const response = await apiService.get<any>('/users/');
            if (response.data && Array.isArray(response.data)) {
                setUsers(response.data);
                transformUsersToTable(response.data);
            }
        } catch (error) {
            toast.error('Error al cargar usuarios');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const transformUsersToTable = (users: User[]) => {
        const transformed: TableUser[] = users.map(user => ({
            id: user.id,
            Código: user.code || '',
            Nombre: user.profile?.first_name && user.profile?.last_name
                ? `${user.profile.first_name} ${user.profile.last_name}`
                : user.email,
            Email: user.email || '',
            Rol: getRoleLabel(user.role),
            Carrera: user.career?.name || '-',
            Estado: user.is_active ? '✅ Activo' : '🚫 Inactivo',
            'Fecha creación': formatDate(user.created_at),
        }));
        setTableData(transformed);
    };

    const applyFilters = () => {
        let filtered = tableData;

        if (filters.code) {
            filtered = filtered.filter(u =>
                u.Código?.toLowerCase().includes(filters.code.toLowerCase())
            );
        }

        if (filters.email) {
            filtered = filtered.filter(u =>
                u.Email?.toLowerCase().includes(filters.email.toLowerCase())
            );
        }

        if (filters.role) {
            const roleLabel = getRoleLabel(filters.role);
            filtered = filtered.filter(u => u.Rol === roleLabel);
        }

        if (filters.is_active) {
            const isActive = filters.is_active === 'true' ? '✅ Activo' : '🚫 Inactivo';
            filtered = filtered.filter(u => u.Estado === isActive);
        }

        setFilteredTableData(filtered);
    };

    const handleFilterChange = (newFilters: Record<string, string>) => {
        setFilters(newFilters);
    };

    const handleInputChange = (rowIndex: number, column: string, value: string) => {
        // Por ahora solo es lectura, pero puedes agregar lógica de edición aquí
        console.log(`Row ${rowIndex}, Column ${column}, Value ${value}`);
    };

    const handleAction = (name: string, item: TableUser) => {
        const userId = item.id;

        switch (name) {
            case 'edit':
                setEditUserId(userId);
                setIsEditModalOpen(true);
                break;
            case 'deactivate':
                setDeactivateUserId(userId);
                setIsDeactivateModalOpen(true);
                break;
            case 'view':
                toast.info(`Detalle del usuario: ${userId}`);
                break;
            default:
                break;
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return 'Administrador';
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
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-black dark:text-white">
                        👥
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Administra administradores, docentes y estudiantes
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="rounded-lg !bg-blue-700 px-6 py-2.5 font-medium !text-white hover:!bg-blue-800 transition shadow-md"
                >
                    ➕ Agregar Usuario
                </button>
            </div>

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
                <InputTable
                    data={filteredTableData}
                    columns={columns}
                    actions={actions}
                    onAction={handleAction}
                    onInputChange={handleInputChange}
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
                onSuccess={() => {
                    setIsDeactivateModalOpen(false);
                    setDeactivateUserId('');
                    loadUsers();
                }}
                userId={deactivateUserId || undefined}
            />
        </div>
    );
}