import { useState } from 'react';
import toast from 'react-hot-toast';
import TeacherAGroupService from '../services/TeacherAGroupService';

interface GroupResult {
    timestamp: string;
    request: {
        teacherId: string;
        subjectId: string;
        semesterId: string;
    };
    response: any;
}

export default function PruebaDocenteGrupo() {
    const [teacherId, setTeacherId] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [semesterId, setSemesterId] = useState('');
    const [name, setName] = useState('');
    const [groupCode, setGroupCode] = useState('');
    const [capacity, setCapacity] = useState('30');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<GroupResult[]>([]);

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!teacherId || !subjectId || !semesterId || !name || !groupCode || !capacity) {
            toast.error('Por favor completa todos los campos');
            return;
        }

        const capacityNum = parseInt(capacity, 10);
        if (capacityNum <= 0) {
            toast.error('La capacidad debe ser mayor a 0');
            return;
        }

        setLoading(true);
        try {
            const response = await TeacherAGroupService.createGroupForTeacher({
                teacherId,
                subjectId,
                semesterId,
                name,
                groupCode,
                capacity: capacityNum,
            });

            if (response.success) {
                toast.success('✅ Grupo creado exitosamente');
                const result: GroupResult = {
                    timestamp: new Date().toLocaleString(),
                    request: {
                        teacherId,
                        subjectId,
                        semesterId,
                    },
                    response,
                };
                setResults([result, ...results]);

                // Limpiar formulario
                setTeacherId('');
                setSubjectId('');
                setSemesterId('');
                setName('');
                setGroupCode('');
                setCapacity('30');
            } else {
                toast.error(`❌ Error: ${response.error}`);
            }
        } catch (error: any) {
            toast.error('Error al crear grupo');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8">
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-5xl font-bold text-gray-900">Prueba Docente a Grupo</h1>
                    <p className="mt-3 text-lg text-gray-700">
                        Crea grupos y asigna docentes para verificar los resultados
                    </p>
                </div>

                {/* Formulario */}
                <div className="mb-8 rounded-xl bg-white p-8 shadow-lg">
                    <h2 className="mb-6 text-2xl font-bold text-gray-900">👨‍🏫 Crear Grupo con Docente</h2>

                    <form onSubmit={handleCreateGroup} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Teacher ID */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">
                                    ID del Docente <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={teacherId}
                                    onChange={(e) => setTeacherId(e.target.value)}
                                    placeholder="Ej: 123e4567-e89b-12d3-a456-426614174000"
                                    disabled={loading}
                                    className="mt-2 w-full rounded-lg border-2 border-gray-300 px-4 py-2 text-sm focus:border-green-500 focus:outline-none disabled:bg-gray-100"
                                />
                            </div>

                            {/* Subject ID */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">
                                    ID de la Asignatura <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={subjectId}
                                    onChange={(e) => setSubjectId(e.target.value)}
                                    placeholder="Ej: 123e4567-e89b-12d3-a456-426614174000"
                                    disabled={loading}
                                    className="mt-2 w-full rounded-lg border-2 border-gray-300 px-4 py-2 text-sm focus:border-green-500 focus:outline-none disabled:bg-gray-100"
                                />
                            </div>

                            {/* Semester ID */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">
                                    ID del Semestre <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={semesterId}
                                    onChange={(e) => setSemesterId(e.target.value)}
                                    placeholder="Ej: 123e4567-e89b-12d3-a456-426614174000"
                                    disabled={loading}
                                    className="mt-2 w-full rounded-lg border-2 border-gray-300 px-4 py-2 text-sm focus:border-green-500 focus:outline-none disabled:bg-gray-100"
                                />
                            </div>

                            {/* Group Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">
                                    Nombre del Grupo <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ej: Grupo A - Introducción a la Programación"
                                    disabled={loading}
                                    className="mt-2 w-full rounded-lg border-2 border-gray-300 px-4 py-2 text-sm focus:border-green-500 focus:outline-none disabled:bg-gray-100"
                                />
                            </div>

                            {/* Group Code */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">
                                    Código del Grupo <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={groupCode}
                                    onChange={(e) => setGroupCode(e.target.value)}
                                    placeholder="Ej: GRP-2026-001"
                                    disabled={loading}
                                    className="mt-2 w-full rounded-lg border-2 border-gray-300 px-4 py-2 text-sm focus:border-green-500 focus:outline-none disabled:bg-gray-100"
                                />
                            </div>

                            {/* Capacity */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">
                                    Capacidad <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={capacity}
                                    onChange={(e) => setCapacity(e.target.value)}
                                    placeholder="Ej: 30"
                                    min="1"
                                    disabled={loading}
                                    className="mt-2 w-full rounded-lg border-2 border-gray-300 px-4 py-2 text-sm focus:border-green-500 focus:outline-none disabled:bg-gray-100"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="mt-6 flex gap-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="rounded-lg bg-green-600 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:bg-green-700 disabled:bg-gray-400"
                            >
                                {loading ? 'Creando...' : '✅ Crear Grupo'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setTeacherId('');
                                    setSubjectId('');
                                    setSemesterId('');
                                    setName('');
                                    setGroupCode('');
                                    setCapacity('30');
                                }}
                                disabled={loading}
                                className="rounded-lg bg-gray-400 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:bg-gray-500 disabled:bg-gray-300"
                            >
                                Limpiar
                            </button>
                        </div>
                    </form>
                </div>

                {/* Resultados */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900">📋 Resultados</h2>
                    {results.length === 0 ? (
                        <div className="rounded-lg bg-blue-50 p-6 text-center">
                            <p className="text-gray-700">No hay resultados aún. Crea un grupo para ver los resultados aquí.</p>
                        </div>
                    ) : (
                        results.map((result, index) => (
                            <div
                                key={index}
                                className={`rounded-lg p-6 shadow-md ${result.response.success ? 'bg-green-50' : 'bg-red-50'
                                    }`}
                            >
                                <div className="mb-4 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-600">
                                        {result.timestamp}
                                    </span>
                                    <span
                                        className={`rounded-full px-4 py-1 text-sm font-bold ${result.response.success
                                                ? 'bg-green-200 text-green-800'
                                                : 'bg-red-200 text-red-800'
                                            }`}
                                    >
                                        {result.response.success ? '✅ Éxito' : '❌ Error'}
                                    </span>
                                </div>

                                <div className="mb-4 border-b border-gray-300 pb-4">
                                    <h3 className="mb-2 font-semibold text-gray-900">Solicitud:</h3>
                                    <div className="grid gap-2 md:grid-cols-3">
                                        <p className="text-sm text-gray-700">
                                            <strong>Docente:</strong> {result.request.teacherId}
                                        </p>
                                        <p className="text-sm text-gray-700">
                                            <strong>Asignatura:</strong> {result.request.subjectId}
                                        </p>
                                        <p className="text-sm text-gray-700">
                                            <strong>Semestre:</strong> {result.request.semesterId}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="mb-2 font-semibold text-gray-900">Respuesta:</h3>
                                    {result.response.success ? (
                                        <div className="space-y-2 text-sm text-gray-700">
                                            <p>
                                                <strong>Docente:</strong> {result.response.details?.teacherName}
                                            </p>
                                            <p>
                                                <strong>Asignatura:</strong> {result.response.details?.subjectName}
                                            </p>
                                            <p>
                                                <strong>ID del Grupo:</strong> {result.response.details?.groupId}
                                            </p>
                                            <p>
                                                <strong>Grupo ID (Datos):</strong> {result.response.group?.id}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-red-800">
                                            <strong>Error:</strong> {result.response.error}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
