import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { showToast } from '../hooks/fireToast';
import studentService from '../services/student.service';
import teacherService from '../services/teacher.service';
import apiService from '../services/api';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    mode?: 'create' | 'edit';
    userId?: string;
}

type UserRole = 'STUDENT' | 'TEACHER';

export default function UserModal({
    isOpen,
    onClose,
    onSuccess,
    mode = 'create',
    userId,
}: UserModalProps) {
    const [currentTab, setCurrentTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Pestaña 1: Datos de usuario
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [role, setRole] = useState<UserRole>('STUDENT');
    const [isActive, setIsActive] = useState(true);

    // Pestaña 2: Datos de perfil
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [identification, setIdentification] = useState('');
    const [phone, setPhone] = useState('');
    const [specialty, setSpecialty] = useState('');

    // Cargar datos si es modo edit
    useEffect(() => {
        if (mode === 'edit' && userId && isOpen) {
            loadUserData();
        } else if (mode === 'create' && isOpen) {
            resetForm();
            setCurrentTab(0);
        }
    }, [mode, userId, isOpen]);

    const loadUserData = async () => {
        setIsLoadingData(true);
        try {
            // Llamada genérica a /users/{userId} - obtiene el usuario con su rol
            const response = await apiService.get<any>(`/users/${userId}`);

            if (!response.data) {
                toast.error('No se encontró el usuario');
                return;
            }

            const userData = response.data;

            // Actualizar el rol obtenido del backend
            const userRole = userData.role as UserRole;
            setRole(userRole);

            // Llenar datos básicos
            setEmail(userData.email || '');
            setCode(userData.code || '');
            setIsActive(userData.is_active !== false);

            // Llenar datos del profile si existen
            if (userData.profile) {
                setFirstName(userData.profile.first_name || '');
                setLastName(userData.profile.last_name || '');
                setIdentification(userData.profile.identification || '');
                setPhone(userData.profile.phone || '');
                setSpecialty(userData.profile.specialty || '');
            }
        } catch (error) {
            toast.error('Error al cargar los datos del usuario');
            console.error(error);
        } finally {
            setIsLoadingData(false);
        }
    };

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setCode('');
        setRole('STUDENT');
        setIsActive(true);
        setFirstName('');
        setLastName('');
        setIdentification('');
        setPhone('');
        setSpecialty('');
    };

    const validateStep1 = (): boolean => {
        if (!email || !email.includes('@')) {
            showToast('Validación', 'Email inválido', 2);
            return false;
        }
        if (mode === 'create' && !password) {
            showToast('Validación', 'Contraseña requerida', 2);
            return false;
        }
        if (password && password.length < 8) {
            showToast('Validación', 'La contraseña debe tener mínimo 8 caracteres', 2);
            return false;
        }
        if (!code) {
            showToast('Validación', 'Código requerido', 2);
            return false;
        }
        return true;
    };

    const validateStep2 = (): boolean => {
        if (!firstName || !lastName || !identification) {
            showToast('Validación', 'Nombre, apellido e identificación son requeridos', 2);
            return false;
        }
        if (role === 'TEACHER' && !phone) {
            showToast('Validación', 'Teléfono requerido para docente', 2);
            return false;
        }
        return true;
    };

    const checkDuplicates = async (): Promise<boolean> => {
        try {
            const response = await apiService.get<any>('/users/');
            const users = response.data || [];

            // Validar email duplicado (excepto en modo edit del mismo usuario)
            const emailExists = users.some((u: any) =>
                u.email.toLowerCase() === email.toLowerCase() &&
                (mode === 'create' || u.id !== userId)
            );
            if (emailExists) {
                showToast('Error', 'El correo ya está registrado en el sistema', 2);
                return false;
            }

            // Validar código duplicado (excepto en modo edit del mismo usuario)
            const codeExists = users.some((u: any) =>
                u.code === code &&
                (mode === 'create' || u.id !== userId)
            );
            if (codeExists) {
                showToast('Error', 'El código ya está registrado en el sistema', 2);
                return false;
            }

            // Validar cédula/identification duplicada (excepto en modo edit del mismo usuario)
            const identificationExists = users.some((u: any) =>
                u.profile?.identification === identification &&
                (mode === 'create' || u.id !== userId)
            );
            if (identificationExists) {
                showToast('Error', 'La cédula ya está registrada en el sistema', 2);
                return false;
            }

            return true;
        } catch (error) {
            showToast('Error', 'Error al validar duplicados', 2);
            return false;
        }
    };

    const handleNext = () => {
        if (validateStep1()) {
            setCurrentTab(1);
        }
    };

    const handleBack = () => {
        setCurrentTab(0);
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // Validar siempre step 1 primero
        if (!validateStep1()) return;

        // Luego validar step 2 si es aplicable
        if (currentTab === 1 && !validateStep2()) return;

        // Validar duplicados antes de enviar
        const noDuplicates = await checkDuplicates();
        if (!noDuplicates) return;

        setLoading(true);
        try {
            if (role === 'STUDENT') {
                if (mode === 'create') {
                    await studentService.createStudent({
                        email,
                        password,
                        code,
                        first_name: firstName,
                        last_name: lastName,
                        identification,
                    });
                    showToast('Éxito', 'Estudiante creado exitosamente', 0);
                } else {
                    await studentService.updateStudent(userId!, {
                        email,
                        first_name: firstName,
                        last_name: lastName,
                        identification,
                    });
                    showToast('Éxito', 'Estudiante actualizado exitosamente', 0);
                }
            } else if (role === 'TEACHER') {
                if (mode === 'create') {
                    await teacherService.createTeacher({
                        email,
                        password,
                        code,
                        first_name: firstName,
                        last_name: lastName,
                        identification,
                        phone,
                        specialty,
                    });
                    showToast('Éxito', 'Docente creado exitosamente', 0);
                } else {
                    await teacherService.updateTeacher(userId!, {
                        email,
                        first_name: firstName,
                        last_name: lastName,
                        identification,
                        phone,
                        specialty,
                    });
                    showToast('Éxito', 'Docente actualizado exitosamente', 0);
                }
            }

            resetForm();
            onSuccess?.();
            onClose();
        } catch (error: any) {
            showToast('Error', error.response?.data?.message || 'Error al guardar el usuario', 2);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                {/* Encabezado */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <h2 className="text-lg font-bold text-gray-900">
                        {mode === 'create' ? 'Crear usuario' : 'Editar usuario'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 px-6">
                    <button
                        onClick={() => setCurrentTab(0)}
                        className={`px-4 py-3 font-medium transition-colors ${currentTab === 0
                                ? 'border-b-2 border-green-600 text-green-600'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Datos de usuario
                    </button>
                    <button
                        onClick={() => setCurrentTab(1)}
                        className={`px-4 py-3 font-medium transition-colors ${currentTab === 1
                            ? 'border-b-2 border-green-600 text-green-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Datos de perfil
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
                    {/* TAB 1: Datos de usuario */}
                    {currentTab === 0 && (
                        <div className="space-y-4">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ejemplo@universidad.edu"
                                    disabled={isLoadingData}
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-green-500 focus:outline-none disabled:bg-gray-100"
                                />
                            </div>

                            {/* Contraseña */}
                            {mode === 'create' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Contraseña <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative mt-1">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Mínimo 8 caracteres"
                                            disabled={isLoadingData}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-green-500 focus:outline-none disabled:bg-gray-100"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? '🙈' : '👁'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Código */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Código <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="Ej. DOC001 o EST001"
                                    disabled={isLoadingData}
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-green-500 focus:outline-none disabled:bg-gray-100"
                                />
                            </div>

                            {/* Rol - solo en modo create */}
                            {mode === 'create' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Rol <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={role}
                                        onChange={(e) => {
                                            setRole(e.target.value as UserRole);
                                            setCurrentTab(0);
                                        }}
                                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                                    >
                                        <option value="STUDENT">Estudiante</option>
                                        <option value="TEACHER">Docente</option>
                                        <option value="ADMIN">Administrador</option>
                                    </select>
                                </div>
                            )}

                            {/* Estado - solo en modo edit */}
                            {mode === 'edit' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Estado <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={isActive ? 'activo' : 'desactivo'}
                                        onChange={(e) => setIsActive(e.target.value === 'activo')}
                                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                                    >
                                        <option value="activo">✅ Activo</option>
                                        <option value="desactivo">🚫 Desactivo</option>
                                    </select>
                                </div>
                            )}

                            {/* Mensaje informativo */}
                            {(
                                <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg
                                                className="h-5 w-5 text-blue-400"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-blue-700">
                                                Los datos del perfil se completarán en la siguiente pestaña según el rol seleccionado.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: Datos de perfil */}
                    {currentTab === 1 && (
                        <div className="space-y-4">
                            {/* Nombre y Apellido */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Nombre <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="Juan"
                                        disabled={isLoadingData}
                                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-green-500 focus:outline-none disabled:bg-gray-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Apellido <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="Pérez"
                                        disabled={isLoadingData}
                                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-green-500 focus:outline-none disabled:bg-gray-100"
                                    />
                                </div>
                            </div>

                            {/* Identificación */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Identificación <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={identification}
                                    onChange={(e) => setIdentification(e.target.value)}
                                    placeholder="1234567890"
                                    disabled={isLoadingData}
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-green-500 focus:outline-none disabled:bg-gray-100"
                                />
                            </div>

                            {/* Teléfono - solo para Teacher */}
                            {role === 'TEACHER' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Teléfono <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="300123456"
                                        disabled={isLoadingData}
                                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-green-500 focus:outline-none disabled:bg-gray-100"
                                    />
                                </div>
                            )}

                            {/* Especialidad - solo para Teacher */}
                            {role === 'TEACHER' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Especialidad
                                    </label>
                                    <input
                                        type="text"
                                        value={specialty}
                                        onChange={(e) => setSpecialty(e.target.value)}
                                        placeholder="Programación"
                                        disabled={isLoadingData}
                                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-green-500 focus:outline-none disabled:bg-gray-100"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Botones */}
                    <div className="mt-6 flex gap-3 border-t border-gray-200 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        {currentTab === 1 && (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Anterior
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={currentTab === 0 ? handleNext : handleSubmit}
                            disabled={loading || isLoadingData}
                            className="flex-1 rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:bg-gray-400"
                        >
                            {loading ? 'Guardando...' : currentTab === 0 ? 'Siguiente' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
