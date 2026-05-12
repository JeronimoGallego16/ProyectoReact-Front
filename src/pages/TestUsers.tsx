import { useState } from 'react';
import UserModal from '../components/UserModal';
import DeactivateUserModal from '../components/DeactivateUserModal';
import SearchUserModal from '../components/SearchUserModal';

interface UserData {
    id: string;
    email: string;
    code: string;
    profile?: {
        first_name?: string;
        last_name?: string;
    };
    role?: string;
}

export default function TestUsers() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [searchAction, setSearchAction] = useState<'edit' | 'deactivate'>('edit');
    const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
    const [editUserId, setEditUserId] = useState<string>('');
    const [deactivateUserId, setDeactivateUserId] = useState<string>('');

    const handleCreateClick = () => {
        setEditMode('create');
        setEditUserId('');
        setIsModalOpen(true);
    };

    const handleEditClick = () => {
        setSearchAction('edit');
        setIsSearchModalOpen(true);
    };

    const handleDeactivateClick = () => {
        setSearchAction('deactivate');
        setIsSearchModalOpen(true);
    };

    const handleUserFound = (userId: string, userData: UserData) => {
        setIsSearchModalOpen(false);

        if (searchAction === 'edit') {
            setEditMode('edit');
            setEditUserId(userId);
            setIsModalOpen(true);
        } else if (searchAction === 'deactivate') {
            setDeactivateUserId(userId);
            setIsDeactivateModalOpen(true);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
            <div className="mx-auto max-w-5xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-5xl font-bold text-gray-900">Gestión de Usuarios</h1>
                    <p className="mt-3 text-lg text-gray-700">Crea y edita administradores, estudiantes y docentes</p>
                </div>

                {/* Botones principales */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row">
                    <button
                        onClick={handleCreateClick}
                        className="flex-1 rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-8 py-4 text-lg font-bold text-white shadow-lg hover:shadow-xl hover:from-green-600 hover:to-green-700 transition-all"
                    >
                        ➕ Crear Usuario
                    </button>
                    <button
                        onClick={handleEditClick}
                        className="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-4 text-lg font-bold text-white shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 transition-all"
                    >
                        ✏️ Editar Usuario
                    </button>
                    <button
                        onClick={handleDeactivateClick}
                        className="flex-1 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-8 py-4 text-lg font-bold text-white shadow-lg hover:shadow-xl hover:from-red-600 hover:to-red-700 transition-all"
                    >
                        🚫 Desactivar Usuario
                    </button>
                </div>

                {/* Información sobre el componente */}
                <div className="space-y-6 rounded-xl border-2 border-indigo-300 bg-white p-8 shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-900">📋 Características del Modal</h2>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="rounded-lg bg-blue-50 p-4">
                            <h3 className="mb-2 flex items-center text-lg font-semibold text-blue-900">
                                <span className="mr-2">📑</span> Dos Pestañas
                            </h3>
                            <p className="text-sm text-blue-800">
                                <strong>Pestaña 1:</strong> Datos de usuario<br />
                                (Email, Contraseña, Código, Rol)<br />
                                <strong>Pestaña 2:</strong> Datos de perfil<br />
                                (varía según el rol)
                            </p>
                        </div>

                        <div className="rounded-lg bg-green-50 p-4">
                            <h3 className="mb-2 flex items-center text-lg font-semibold text-green-900">
                                <span className="mr-2">👥</span> Roles Diferenciados
                            </h3>
                            <ul className="space-y-1 text-sm text-green-800">
                                <li>• <strong>Admin:</strong> Solo datos básicos</li>
                                <li>• <strong>Student:</strong> + Nombre, Apellido, ID</li>
                                <li>• <strong>Teacher:</strong> + Teléfono, Especialidad</li>
                            </ul>
                        </div>

                        <div className="rounded-lg bg-purple-50 p-4">
                            <h3 className="mb-2 flex items-center text-lg font-semibold text-purple-900">
                                <span className="mr-2">⚙️</span> Validaciones
                            </h3>
                            <ul className="space-y-1 text-sm text-purple-800">
                                <li>✓ Email válido</li>
                                <li>✓ Campos requeridos</li>
                                <li>✓ Contraseña mín. 8 caracteres</li>
                            </ul>
                        </div>

                        <div className="rounded-lg bg-red-50 p-4">
                            <h3 className="mb-2 flex items-center text-lg font-semibold text-red-900">
                                <span className="mr-2">🚫</span> Desactivación
                            </h3>
                            <ul className="space-y-1 text-sm text-red-800">
                                <li>✓ Busca por ID de usuario</li>
                                <li>✓ Muestra datos antes de confirmar</li>
                                <li>✓ Desactiva usuario sin eliminar datos</li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t-2 border-gray-200 pt-4">
                        <p className="text-sm text-gray-600">
                            <strong>💡 Instrucciones:</strong><br />
                            1. Haz clic en "<strong>➕ Crear Usuario</strong>" para crear un nuevo usuario<br />
                            2. Haz clic en "<strong>✏️ Editar Usuario</strong>" e ingresa un ID para editar<br />
                            3. Haz clic en "<strong>🚫 Desactivar Usuario</strong>" para desactivar un usuario<br />
                            4. Completa los datos en el modal (2 pestañas para algunos roles)<br />
                            5. Haz clic en "Guardar" o "Desactivar usuario" para completar la acción
                        </p>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false);
                }}
                mode={editMode}
                userId={editUserId || undefined}
            />

            {/* Modal de Búsqueda de Usuario */}
            <SearchUserModal
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
                onUserFound={handleUserFound}
                action={searchAction}
            />

            {/* Modal de Desactivación */}
            <DeactivateUserModal
                isOpen={isDeactivateModalOpen}
                onClose={() => {
                    setIsDeactivateModalOpen(false);
                    setDeactivateUserId('');
                }}
                onSuccess={() => {
                    setIsDeactivateModalOpen(false);
                    setDeactivateUserId('');
                }}
                userId={deactivateUserId || undefined}
            />
        </div>
    );
}

