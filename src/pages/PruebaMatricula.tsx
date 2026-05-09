import { useState } from 'react';
import toast from 'react-hot-toast';
import StudentRegistrationService from '../services/StudentRegistrationService';
import FilterTable from '../components/FilterTable';

interface RegistrationResult {
    timestamp: string;
    request: {
        studentId: string;
        careerId: string;
    };
    response: any;
}

export default function PruebaMatricula() {
    const [studentId, setStudentId] = useState('');
    const [careerId, setCareerId] = useState('');
    const [admissionPeriod, setAdmissionPeriod] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [academicStatus, setAcademicStatus] = useState('ACTIVE');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<RegistrationResult[]>([]);
    const [filters, setFilters] = useState<Record<string, string>>({});

    const filterOptions = [
        {
            id: 'asignatura',
            label: 'Asignatura',
            type: 'select' as const,
            placeholder: 'Todas',
            options: [
                { value: 'programacion', label: 'Programación I' },
                { value: 'estructuras', label: 'Estructuras de Datos' },
                { value: 'algoritmos', label: 'Algoritmos' },
                { value: 'bd', label: 'Bases de Datos' },
            ],
        },
        {
            id: 'evaluacion',
            label: 'Evaluación',
            type: 'select' as const,
            placeholder: 'Todas',
            options: [
                { value: 'proyecto', label: 'Proyecto de Programación' },
                { value: 'examen', label: 'Examen Parcial' },
                { value: 'quiz', label: 'Quiz' },
            ],
        },
        {
            id: 'grupo',
            label: 'Grupo',
            type: 'select' as const,
            placeholder: 'Todos',
            options: [
                { value: 'ing-sis-01', label: 'ING-SIS-01' },
                { value: 'ing-sis-02', label: 'ING-SIS-02' },
                { value: 'ing-sis-03', label: 'ING-SIS-03' },
            ],
        },
        {
            id: 'docente',
            label: 'Docente',
            type: 'select' as const,
            placeholder: 'Todos',
            options: [
                { value: 'luis-perez', label: 'Luis Pérez' },
                { value: 'maria-garcia', label: 'María García' },
                { value: 'juan-martinez', label: 'Juan Martínez' },
            ],
        },
    ];

    const handleFilterChange = (newFilters: Record<string, string>) => {
        setFilters(newFilters);
        // Los datos se filtrarán cuando se implementen
        console.log('Filtros aplicados:', newFilters);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!studentId || !careerId) {
            toast.error('Por favor completa todos los campos');
            return;
        }

        setLoading(true);
        try {
            const response = await StudentRegistrationService.registerStudentToCareer({
                studentId,
                careerId,
                admissionPeriod,
                academicStatus,
            });

            if (response.success) {
                toast.success('✅ Matrícula registrada exitosamente');
                const result: RegistrationResult = {
                    timestamp: new Date().toLocaleString(),
                    request: {
                        studentId,
                        careerId,
                    },
                    response,
                };
                setResults([result, ...results]);

                // Limpiar formulario
                setStudentId('');
                setCareerId('');
                setAdmissionPeriod(new Date().toISOString().split('T')[0]);
                setAcademicStatus('ACTIVE');
            } else {
                toast.error(`❌ Error: ${response.error}`);
            }
        } catch (error: any) {
            toast.error('Error al registrar matrícula');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-8">
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-5xl font-bold text-gray-900">Prueba de Matrícula</h1>
                    <p className="mt-3 text-lg text-gray-700">
                        Matricula estudiantes a carreras y verifica los resultados
                    </p>
                </div>

                {/* Formulario */}
                <div className="mb-8 rounded-xl bg-white p-8 shadow-lg">
                    <h2 className="mb-6 text-2xl font-bold text-gray-900">📝 Registrar Estudiante a Carrera</h2>

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Student ID */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">
                                    ID del Estudiante <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={studentId}
                                    onChange={(e) => setStudentId(e.target.value)}
                                    placeholder="Ej: 123e4567-e89b-12d3-a456-426614174000"
                                    disabled={loading}
                                    className="mt-2 w-full rounded-lg border-2 border-gray-300 px-4 py-2 text-sm focus:border-purple-500 focus:outline-none disabled:bg-gray-100"
                                />
                            </div>

                            {/* Career ID */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">
                                    ID de la Carrera <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={careerId}
                                    onChange={(e) => setCareerId(e.target.value)}
                                    placeholder="Ej: 123e4567-e89b-12d3-a456-426614174000"
                                    disabled={loading}
                                    className="mt-2 w-full rounded-lg border-2 border-gray-300 px-4 py-2 text-sm focus:border-purple-500 focus:outline-none disabled:bg-gray-100"
                                />
                            </div>

                            {/* Admission Period */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">
                                    Periodo de Admisión
                                </label>
                                <input
                                    type="date"
                                    value={admissionPeriod}
                                    onChange={(e) => setAdmissionPeriod(e.target.value)}
                                    disabled={loading}
                                    className="mt-2 w-full rounded-lg border-2 border-gray-300 px-4 py-2 text-sm focus:border-purple-500 focus:outline-none disabled:bg-gray-100"
                                />
                            </div>

                            {/* Academic Status */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">
                                    Estado Académico
                                </label>
                                <select
                                    value={academicStatus}
                                    onChange={(e) => setAcademicStatus(e.target.value)}
                                    disabled={loading}
                                    className="mt-2 w-full rounded-lg border-2 border-gray-300 px-4 py-2 text-sm focus:border-purple-500 focus:outline-none disabled:bg-gray-100"
                                >
                                    <option value="ACTIVE">Activo</option>
                                    <option value="INACTIVE">Inactivo</option>
                                    <option value="GRADUATED">Graduado</option>
                                    <option value="WITHDRAWN">Retirado</option>
                                </select>
                            </div>
                        </div>

                        {/* Botón */}
                        <div className="mt-6 flex gap-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-3 font-bold text-white hover:shadow-lg hover:from-purple-600 hover:to-purple-700 disabled:bg-gray-400 transition-all"
                            >
                                {loading ? '⏳ Registrando...' : '✅ Registrar Matrícula'}
                            </button>
                        </div>
                    </form>

                    {/* Mensaje informativo */}
                    <div className="mt-6 rounded-lg border-2 border-blue-300 bg-blue-50 p-4">
                        <p className="text-sm text-blue-800">
                            <strong>💡 Instrucciones:</strong><br />
                            1. Obtén un ID de estudiante existente (desde TestUsers u otro lado)<br />
                            2. Obtén un ID de carrera existente<br />
                            3. Completa los campos y haz clic en "Registrar Matrícula"<br />
                            4. Los resultados aparecerán en la sección de abajo
                        </p>
                    </div>
                </div>

                {/* Filtro de Tabla */}
                <div className="mb-8">
                    <FilterTable filters={filterOptions} onFilterChange={handleFilterChange} />
                </div>

                {/* Resultados */}
                {results.length > 0 && (
                    <div className="rounded-xl bg-white p-8 shadow-lg">
                        <h2 className="mb-6 text-2xl font-bold text-gray-900">📊 Resultados de Matrículas</h2>
                        <div className="space-y-4">
                            {results.map((result, index) => (
                                <div
                                    key={index}
                                    className={`rounded-lg border-2 p-4 ${result.response.success
                                            ? 'border-green-400 bg-green-50'
                                            : 'border-red-400 bg-red-50'
                                        }`}
                                >
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="font-bold text-gray-900">
                                            {result.response.success ? '✅ Éxito' : '❌ Error'}
                                        </h3>
                                        <span className="text-xs text-gray-500">{result.timestamp}</span>
                                    </div>

                                    {/* Request */}
                                    <div className="mb-3 rounded bg-gray-100 p-3">
                                        <p className="text-xs font-semibold text-gray-700">Request:</p>
                                        <pre className="mt-1 text-xs text-gray-600 overflow-auto">
                                            {JSON.stringify(result.request, null, 2)}
                                        </pre>
                                    </div>

                                    {/* Response */}
                                    <div className="rounded bg-gray-100 p-3">
                                        <p className="text-xs font-semibold text-gray-700">Response:</p>
                                        <pre className="mt-1 text-xs text-gray-600 overflow-auto max-h-48">
                                            {JSON.stringify(result.response, null, 2)}
                                        </pre>
                                    </div>

                                    {/* Detalles de éxito */}
                                    {result.response.success && result.response.details && (
                                        <div className="mt-3 rounded border-l-4 border-green-500 bg-white p-3">
                                            <p className="text-sm text-gray-700">
                                                <strong>Estudiante:</strong> {result.response.details.studentName}<br />
                                                <strong>Carrera:</strong> {result.response.details.careerName}<br />
                                                <strong>ID Matrícula:</strong> <code className="text-xs bg-gray-200 px-1">{result.response.details.registrationId}</code>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Estado vacío */}
                {results.length === 0 && (
                    <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
                        <p className="text-gray-600">
                            No hay resultados aún. Completa el formulario y envía una matrícula para ver los resultados aquí.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
