import { useState, useEffect } from 'react';
import FilterTable from '../components/FilterTable';
import { careerService } from '../services/CareerService';
import { registrationService } from '../services/RegistrationService';
import studentRegistrationService from '../services/StudentRegistrationService';
import student from '../services/student.service';
import { toast } from 'react-hot-toast';
import { Career } from '../models/Career';
import { Student } from '../models/Student';

interface EnrollmentFormData {
    studentId: string;
    careerId: string;
    admissionPeriod: string;
    academicStatus: string;
}

export default function EnrollmentPage() {
    const [studentsData, setStudentsData] = useState<Student[]>([]);
    const [careersData, setCareersData] = useState<Career[]>([]);
    const [registrationsData, setRegistrationsData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState<Record<string, string>>({});

    // Modales
    const [showSelectModal, setShowSelectModal] = useState(false);
    const [showEnrollModal, setShowEnrollModal] = useState(false);

    // Formulario de selección
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');

    // Formulario de matrícula
    const [formData, setFormData] = useState<EnrollmentFormData>({
        studentId: '',
        careerId: '',
        admissionPeriod: new Date().toISOString().split('T')[0],
        academicStatus: 'ACTIVE',
    });

    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isEnrolling, setIsEnrolling] = useState(false);

    // Función para cargar registrations
    const loadRegistrations = async () => {
        try {
            const registrations = await registrationService.getRegistrations();
            setRegistrationsData(registrations || []);
        } catch (error) {
            console.error('Error cargando matrículas:', error);
        }
    };

    // Cargar datos iniciales
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [studentsRes, careersRes, registrations] = await Promise.all([
                    student.getAllStudents(),
                    careerService.getCareers(),
                    registrationService.getRegistrations(),
                ]);

                setStudentsData((studentsRes?.data as Student[]) || []);
                setCareersData(careersRes || []);
                setRegistrationsData(registrations || []);
            } catch (error) {
                console.error('Error cargando datos:', error);
                toast.error('Error cargando los datos');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleFilterChange = (filters: Record<string, string>) => {
        setFilters(filters);
    };

    const filteredStudents = studentsData.filter(s => {
        const fullName = `${s.profile?.first_name || ''} ${s.profile?.last_name || ''}`.toLowerCase();
        const searchText = (filters.search || '').toLowerCase();
        return (
            fullName.includes(searchText) ||
            (s.email && s.email.toLowerCase().includes(searchText))
        );
    });

    // ===== CREAR MATRÍCULA =====
    const handleEnrollStudent = async () => {
        if (!formData.studentId || !formData.careerId || !formData.admissionPeriod) {
            toast.error('Por favor completa todos los campos requeridos');
            return;
        }

        try {
            setIsEnrolling(true);
            const result = await studentRegistrationService.registerStudentToCareer({
                studentId: formData.studentId,
                careerId: formData.careerId,
                admissionPeriod: formData.admissionPeriod,
                academicStatus: formData.academicStatus,
            });

            if (result.success) {
                toast.success(`${selectedStudent?.profile?.first_name} matriculado(a) correctamente`);
                setShowEnrollModal(false);
                setSelectedStudent(null);
                setFormData({
                    studentId: '',
                    careerId: '',
                    admissionPeriod: new Date().toISOString().split('T')[0],
                    academicStatus: 'ACTIVE',
                });
                // Recargar registrations para actualizar la tabla
                await loadRegistrations();
            } else {
                toast.error(result.error || 'Error al matricular estudiante');
            }
        } catch (error: any) {
            console.error('Error matriculando estudiante:', error);
            toast.error(error.message || 'Error al matricular estudiante');
        } finally {
            setIsEnrolling(false);
        }
    };

    const getCareerName = (careerId: string) => {
        return careersData.find(c => c.id === careerId)?.name || '-';
    };

    // ===== OBTENER CARRERA ACTUAL DEL ESTUDIANTE =====
    const getStudentCurrentCareer = (studentId: string) => {
        // Buscar la matrícula activa más reciente del estudiante
        const studentRegistrations = registrationsData.filter(
            r => r.student_id === studentId && r.is_active
        );

        if (studentRegistrations.length === 0) {
            return '-';
        }

        // Obtener el nombre de la carrera
        const latestRegistration = studentRegistrations[0];
        return getCareerName(latestRegistration.career_id);
    };

    // ===== ABRIR MODAL DE SELECCIÓN =====
    const handleOpenSelectModal = () => {
        setSelectedStudentId('');
        setShowSelectModal(true);
    };

    // ===== CONFIRMAR SELECCIÓN Y ABRIR MODAL DE MATRÍCULA =====
    const handleConfirmSelection = () => {
        if (!selectedStudentId) {
            toast.error('Por favor selecciona un estudiante');
            return;
        }

        const stud = studentsData.find(s => s.id === selectedStudentId);
        if (stud) {
            setSelectedStudent(stud);
            setFormData({
                studentId: stud.id,
                careerId: '',
                admissionPeriod: new Date().toISOString().split('T')[0],
                academicStatus: 'ACTIVE',
            });
            setShowSelectModal(false);
            setShowEnrollModal(true);
        }
    };

    if (loading) {
        return <div className="p-6">Cargando datos...</div>;
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-black dark:text-white">Estudiantes Matriculados</h1>
                <button
                    onClick={handleOpenSelectModal}
                    className="rounded-lg bg-green-700 px-6 py-2 font-medium text-white hover:bg-green-800"
                >
                    + Matricular Estudiante
                </button>
            </div>

            {/* Filtro para buscar estudiantes */}
            <FilterTable
                filters={[
                    { id: 'search', label: 'Buscar Estudiante', placeholder: 'Nombre, apellido o email...', type: 'text' },
                ]}
                onFilterChange={handleFilterChange}
            />

            {/* Lista de estudiantes */}
            <div className="overflow-x-auto rounded-lg border border-strokedark bg-white dark:bg-boxdark">
                <table className="w-full">
                    <thead className="bg-gray-100 dark:bg-meta-4">
                        <tr>
                            <th className="px-4 py-4 text-left font-semibold text-black dark:text-white">Estudiante</th>
                            <th className="px-4 py-4 text-left font-semibold text-black dark:text-white">Cédula</th>
                            <th className="px-4 py-4 text-left font-semibold text-black dark:text-white">Carrera Actual</th>
                            <th className="px-4 py-4 text-left font-semibold text-black dark:text-white">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                    No hay estudiantes disponibles
                                </td>
                            </tr>
                        ) : (
                            filteredStudents.map((stud, index) => (
                                <tr key={stud.id} className={index % 2 === 0 ? 'bg-white dark:bg-boxdark' : 'bg-gray-50 dark:bg-meta-4'}>
                                    <td className="px-4 py-5 text-sm text-black dark:text-white font-medium">
                                        {stud.profile?.first_name} {stud.profile?.last_name}
                                    </td>
                                    <td className="px-4 py-5 text-sm text-black dark:text-white font-semibold">
                                        {stud.profile?.identification || '-'}
                                    </td>
                                    <td className="px-4 py-5 text-sm text-black dark:text-white">
                                        {getStudentCurrentCareer(stud.profile?.id || '')}
                                    </td>
                                    <td className="px-4 py-5 text-sm">
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${stud.is_active
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                                            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                                            }`}>
                                            {stud.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Seleccionar Estudiante */}
            {showSelectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-boxdark">
                        <h2 className="mb-6 text-2xl font-bold text-black dark:text-white">
                            Seleccionar Estudiante
                        </h2>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                Estudiante *
                            </label>
                            <select
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                                className="w-full rounded border border-stroke bg-transparent py-2 px-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                            >
                                <option value="">-- Selecciona un estudiante --</option>
                                {studentsData
                                    .filter(s => s.is_active)
                                    .map((stud) => (
                                        <option key={stud.id} value={stud.id}>
                                            {stud.profile?.first_name} {stud.profile?.last_name} ({stud.profile?.identification})
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => setShowSelectModal(false)}
                                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmSelection}
                                className="flex-1 rounded-lg bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800"
                            >
                                Continuar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Matricular Estudiante */}
            {showEnrollModal && selectedStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-boxdark">
                        <h2 className="mb-2 text-2xl font-bold text-black dark:text-white">
                            Matricular Estudiante
                        </h2>
                        <p className="mb-6 text-gray-600 dark:text-gray-400">
                            {selectedStudent.profile?.first_name} {selectedStudent.profile?.last_name}
                        </p>

                        <div className="space-y-4">
                            {/* Carrera */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                    Carrera *
                                </label>
                                <select
                                    value={formData.careerId}
                                    onChange={(e) => setFormData({ ...formData, careerId: e.target.value })}
                                    className="w-full rounded border border-stroke bg-transparent py-2 px-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                >
                                    <option value="">-- Selecciona una carrera --</option>
                                    {careersData
                                        .filter(c => c.is_active)
                                        .map((career) => (
                                            <option key={career.id} value={career.id}>
                                                {career.code} - {career.name}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            {/* Período de Ingreso */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                    Período de Ingreso *
                                </label>
                                <input
                                    type="date"
                                    value={formData.admissionPeriod}
                                    onChange={(e) => setFormData({ ...formData, admissionPeriod: e.target.value })}
                                    className="w-full rounded border border-stroke bg-transparent py-2 px-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                />
                            </div>

                            {/* Estado Académico */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                    Estado Académico *
                                </label>
                                <select
                                    value={formData.academicStatus}
                                    onChange={(e) => setFormData({ ...formData, academicStatus: e.target.value })}
                                    className="w-full rounded border border-stroke bg-transparent py-2 px-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                >
                                    <option value="ACTIVE">Activo</option>
                                    <option value="INACTIVE">Inactivo</option>
                                    <option value="SUSPENDED">Suspendido</option>
                                    <option value="GRADUATED">Graduado</option>
                                    <option value="RETIRED">Retirado</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => {
                                    setShowEnrollModal(false);
                                    setSelectedStudent(null);
                                }}
                                disabled={isEnrolling}
                                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleEnrollStudent}
                                disabled={isEnrolling}
                                className="flex-1 rounded-lg bg-green-700 px-4 py-2 font-medium text-white hover:bg-green-800 disabled:opacity-50"
                            >
                                {isEnrolling ? 'Matriculando...' : 'Confirmar Matrícula'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
