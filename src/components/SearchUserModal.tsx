import React, { useState } from 'react';
import toast from 'react-hot-toast';
import apiService from '../services/api';

interface SearchUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUserFound: (userId: string, userData: UserData) => void;
    action: 'edit' | 'deactivate';
}

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

export default function SearchUserModal({
    isOpen,
    onClose,
    onUserFound,
    action,
}: SearchUserModalProps) {
    const [userId, setUserId] = useState('');
    const [isLoadingUser, setIsLoadingUser] = useState(false);

    const handleSearchUser = async () => {
        if (!userId.trim()) {
            toast.error('Ingresa el ID del usuario');
            return;
        }

        setIsLoadingUser(true);
        try {
            const response = await apiService.get<any>(`/users/${userId.trim()}`);

            if (!response.data) {
                toast.error('Usuario no encontrado');
                setIsLoadingUser(false);
                return;
            }

            const userData = response.data;
            // Llamar al callback con los datos del usuario encontrado
            onUserFound(userData.id, userData);
            resetForm();
        } catch (error) {
            toast.error('Error al buscar el usuario');
            console.error(error);
        } finally {
            setIsLoadingUser(false);
        }
    };

    const resetForm = () => {
        setUserId('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    const actionText = action === 'edit' ? 'Editar' : 'Desactivar';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                {/* Encabezado */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <h2 className="text-lg font-bold text-gray-900">
                        {actionText} Usuario
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                </div>

                <div className="px-6 py-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                ID del Usuario <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                placeholder="Ej. 507f1f77bcf86cd799439011"
                                onKeyPress={(e) => e.key === 'Enter' && handleSearchUser()}
                                disabled={isLoadingUser}
                                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
                            />
                        </div>

                        <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                            <p className="text-sm text-blue-800">
                                💡 Ingresa el ID del usuario que deseas {actionText.toLowerCase()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSearchUser}
                        disabled={isLoadingUser}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md transition-colors"
                    >
                        {isLoadingUser ? 'Buscando...' : 'Buscar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
