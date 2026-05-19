import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import studentService from '../services/student.service';
import teacherService from '../services/teacher.service';
import apiService from '../services/api';

interface DeactivateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (isActive: boolean) => void;
    userId?: string;
    user?: UserData; // <-- nuevo: pasar el objeto usuario directamente evita re-fetch con datos viejos
}

interface UserData {
    id: string;
    email: string;
    code: string;
    is_active?: boolean;
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
    user: initialUser, // <-- nuevo
}: DeactivateUserModalProps) {
    const [userId, setUserId] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLoadingUser, setIsLoadingUser] = useState(false);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [step, setStep] = useState<'input' | 'confirm'>('input');

    useEffect(() => {
        if (!isOpen) return;

        if (initialUserId) {
            if (initialUser) {
                // Si el padre ya mandó el objeto completo, úsalo directamente
                // Esto garantiza que is_active refleja el estado actual en el padre
                setUserData(initialUser);
                setUserId(initialUserId);
                setStep('confirm');
            } else {
                loadUserData(initialUserId);
            }
        } else {
            setStep('input');
        }
    }, [isOpen, initialUserId, initialUser]);

    const loadUserData = async (id: string) => {
        setIsLoadingUser(true);
        try {
            const response = await apiService.get<any>(`/users/${id.trim()}`);

            if (!response.data) {
                toast.error('Usuario no encontrado');
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
            const newIsActive = !userData.is_active;

            console.log('Toggling user:', userData.id);
            console.log('Current is_active:', userData.is_active);
            console.log('New is_active:', newIsActive);

            let response: any;

            if (role === 'STUDENT') {
                response = await studentService.deactivateStudent(userData.id, newIsActive);
            } else if (role === 'TEACHER') {
                response = await teacherService.deactivateTeacher(userData.id, newIsActive);
            }

            console.log('Response:', response);

            if (!response?.success) {
                const errorMsg = response?.error || 'Error al actualizar el usuario';
                toast.error(errorMsg);
                return;
            }

            const message = newIsActive ? 'Usuario activado exitosamente' : 'Usuario desactivado exitosamente';
            toast.success(message);

            // Actualizar userData local para reflejar el nuevo estado
            setUserData(prev => prev ? { ...prev, is_active: newIsActive } : prev);

            resetForm();
            onSuccess?.(newIsActive);
            onClose();
        } catch (error: any) {
            console.error('Exception during deactivation:', error);
            toast.error(error.response?.data?.message || 'Error al actualizar el usuario');
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
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="relative mx-auto my-auto flex w-full max-w-2xl max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-stroke bg-white shadow-2xl dark:border-strokedark dark:bg-boxdark">
                {/* Encabezado */}
                <div className="border-b border-stroke px-6 py-5 dark:border-strokedark">
                    <h2 className="text-lg font-semibold text-black dark:text-white">
                        {step === 'input'
                            ? 'Buscar Usuario'
                            : userData?.is_active
                                ? 'Desactivar Usuario'
                                : 'Activar Usuario'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-body hover:text-black dark:text-bodydark dark:hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6.5">
                    {step === 'input' ? (
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
                                    💡 Ingresa el ID del usuario que deseas activar o desactivar. El usuario puede cambiar de estado en cualquier momento.
                                </p>
                            </div>

                            <div className="flex gap-3 border-t border-stroke pt-4 dark:border-strokedark">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 rounded-md border border-stroke px-4 py-2.5 font-medium text-black transition hover:bg-gray-2 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSearchUser}
                                    disabled={isLoadingUser || !userId.trim()}
                                    className="flex-1 rounded-md bg-primary px-4 py-2.5 font-medium text-white transition hover:bg-opacity-90 disabled:opacity-50"
                                >
                                    {isLoadingUser ? 'Buscando...' : 'Buscar'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                    <div className={`flex h-20 w-20 items-center justify-center rounded-full ${userData?.is_active ? 'bg-red-100' : 'bg-green-100'}`}>
                                        <span className="text-3xl">{userData?.is_active ? '🔴' : '🟢'}</span>
                                </div>
                            </div>

                            <div className="text-center">
                                <h3 className="text-lg font-bold text-gray-900">
                                        {userData?.is_active
                                            ? '¿Estás seguro que deseas desactivar este usuario?'
                                            : '¿Estás seguro que deseas activar este usuario?'}
                                </h3>
                                <p className="mt-2 text-sm text-gray-600">
                                        {userData?.is_active
                                            ? 'El usuario no podrá iniciar sesión en el sistema, pero su información se mantendrá.'
                                            : 'El usuario podrá acceder nuevamente al sistema.'}
                                </p>
                            </div>

                            {userData && (
                                    <div className={`rounded-lg border p-4 ${userData.is_active
                                        ? 'border-red-200 bg-red-50'
                                        : 'border-green-200 bg-green-50'
                                        }`}>
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
                                            <div className="flex items-start">
                                                <span className="w-20 font-medium text-gray-700">Estado:</span>
                                                <span className={`font-semibold ${userData.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                                    {userData.is_active ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 border-t border-stroke pt-4 dark:border-strokedark">
                                <button
                                    type="button"
                                        onClick={handleClose}
                                    className="flex-1 rounded-md border border-stroke px-4 py-2.5 font-medium text-black transition hover:bg-gray-2 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeactivate}
                                    disabled={loading}
                                        className="flex-1 rounded-md bg-primary px-4 py-2.5 font-medium text-white transition hover:bg-opacity-90 disabled:opacity-50"
                                >
                                        {loading
                                            ? 'Procesando...'
                                            : userData?.is_active
                                                ? 'Desactivar usuario'
                                                : 'Activar usuario'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}