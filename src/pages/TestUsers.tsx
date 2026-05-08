import { useState } from 'react';
import UserModal from '../components/UserModal';

export default function TestUsers() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
    const [editUserId, setEditUserId] = useState<string>('');

    const handleCreateClick = () => {
        setEditMode('create');
        setEditUserId('');
        setIsModalOpen(true);
    };

    const handleEditClick = () => {
        const id = prompt('Ingresa el ID del usuario a editar:');
        if (id && id.trim()) {
            setEditMode('edit');
            setEditUserId(id.trim());
            setIsModalOpen(true);
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

                        <div className="rounded-lg bg-orange-50 p-4">
                            <h3 className="mb-2 flex items-center text-lg font-semibold text-orange-900">
                                <span className="mr-2">🎯</span> Modo Editar
                            </h3>
                            <ul className="space-y-1 text-sm text-orange-800">
                                <li>✓ Carga datos automáticos</li>
                                <li>✓ Modifica información</li>
                                <li>✓ Actualiza en el backend</li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t-2 border-gray-200 pt-4">
                        <p className="text-sm text-gray-600">
                            <strong>💡 Instrucciones:</strong><br />
                            1. Haz clic en "<strong>➕ Crear Usuario</strong>" para crear un nuevo usuario<br />
                            2. Haz clic en "<strong>✏️ Editar Usuario</strong>" e ingresa un ID para editar<br />
                            3. Completa los datos en el modal (2 pestañas para algunos roles)<br />
                            4. Haz clic en "Guardar" para guardar los cambios
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
        </div>
    );
}

