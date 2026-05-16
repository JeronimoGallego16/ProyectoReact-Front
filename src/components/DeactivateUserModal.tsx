import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import adminService from '../services/admin.service';
import studentService from '../services/student.service';
import teacherService from '../services/teacher.service';
import apiService from '../services/api';

interface DeactivateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    userId?: string;
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

export default function DeactivateUserModal({
    isOpen,
    onClose,
    onSuccess,
    userId: initialUserId,
}: DeactivateUserModalProps) {
    const [userId, setUserId] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLoadingUser, setIsLoadingUser] = useState(false);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [step, setStep] = useState<'input' | 'confirm'>('input');

    // Cargar datos del usuario si se proporciona initialUserId
    useEffect(() => {
        if (isOpen && initialUserId) {
            loadUserData(initialUserId);
        } else if (isOpen) {
            setStep('input');
        }
    }, [isOpen, initialUserId]);

    const loadUserData = async (id: string) => {
        setIsLoadingUser(true);
        try {
            const response = await apiService.get<any>(`/users/${id.trim()}`);

            if (!response.data) {
                toast.error('Usuario no encontrado');
                setIsLoadingUser(false);
                return;
            }

            setUserData(response.data);
            setUserId(id);
            setStep('confirm');
        } catch (error) {
            toast.error('Error al buscar el usuario');
            console.error(error);
        } finally {
            setIsLoadingUser(false);
        }
    };

    const handleSearchUser = async () => {
        if (!userId.trim()) {
            toast.error('Ingresa el ID del usuario');
            return;
        }

        await loadUserData(userId);
    };

    const handleDeactivate = async () => {
        if (!userData) return;

        setLoading(true);
        try {
            const role = userData.role || 'STUDENT';
            let response: any;

            if (role === 'ADMIN') {
                response = await adminService.deactivateAdmin(userData.id);
            } else if (role === 'STUDENT') {
                response = await studentService.deactivateStudent(userData.id);
            } else if (role === 'TEACHER') {
                response = await teacherService.deactivateTeacher(userData.id);
            }

            console.log('Deactivate response:', response);

            if (!response?.success) {
                const errorMsg = response?.error || 'Error al desactivar el usuario';
                console.error('Deactivation error:', errorMsg);
                toast.error(errorMsg);
                setLoading(false);
                return;
            }

            toast.success('Usuario desactivado exitosamente');
            resetForm();
            onSuccess?.();
            onClose();
        } catch (error: any) {
            console.error('Exception during deactivation:', error);
            toast.error(error.response?.data?.message || 'Error al desactivar el usuario');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setUserId('');
        setUserData(null);
        setStep('input');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                {/* Encabezado */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <h2 className="text-lg font-bold text-gray-900">
                        {step === 'input' ? 'Buscar Usuario' : 'Desactivar Usuario'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                </div>

                <div className="px-6 py-6">
                    {step === 'input' ? (
                        // Paso 1: Pedir ID
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
                                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-red-500 focus:outline-none disabled:bg-gray-100"
                                />
                            </div>

                            <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                                <p className="text-sm text-amber-800">
                                    💡 Ingresa el ID del usuario que deseas desactivar. El usuario no podrá iniciar sesión, pero su información se mantendrá.
                                </p>
                            </div>

                            {/* Botones */}
                            <div className="flex gap-3 border-t border-gray-200 pt-4">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSearchUser}
                                    disabled={isLoadingUser || !userId.trim()}
                                    className="flex-1 rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
                                >
                                    {isLoadingUser ? 'Buscando...' : 'Buscar'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        // Paso 2: Confirmación con datos del usuario
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                                    <span className="text-3xl">👤</span>
                                </div>
                            </div>

                            <div className="text-center">
                                <h3 className="text-lg font-bold text-gray-900">
                                    ¿Estás seguro que deseas desactivar este usuario?
                                </h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    El usuario no podrá iniciar sesión en el sistema, pero su información se mantendrá.
                                </p>
                            </div>

                            {userData && (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-start">
                                            <span className="w-20 font-medium text-gray-700">Usuario:</span>
                                            <span className="text-gray-900">
                                                {userData.profile?.first_name && userData.profile?.last_name
                                                    ? `${userData.profile.first_name} ${userData.profile.last_name}`
                                                    : userData.email}
                                            </span>
                                        </div>
                                        <div className="flex items-start">
                                            <span className="w-20 font-medium text-gray-700">Email:</span>
                                            <span className="text-gray-900">{userData.email}</span>
                                        </div>
                                        <div className="flex items-start">
                                            <span className="w-20 font-medium text-gray-700">Código:</span>
                                            <span className="text-gray-900">{userData.code}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Botones */}
                            <div className="flex gap-3 border-t border-gray-200 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        resetForm();
                                    }}
                                    className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeactivate}
                                    disabled={loading}
                                    className="flex-1 rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:bg-gray-400"
                                >
                                    {loading ? 'Desactivando...' : 'Desactivar usuario'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
