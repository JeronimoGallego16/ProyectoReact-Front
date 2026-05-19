import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import GenericTable from '../components/GenericTable';
import DetailRegistrationModal from '../components/DetailRegistrationModal';
import EditRegistrationModal from '../components/EditRegistrationModal';
import ChangeRegistrationStatusModal from '../components/ChangeRegistrationStatusModal';
import EnrollRegistrationModal from '../components/EnrollRegistrationModal';
import { careerService } from '../services/CareerService';
import { registrationService } from '../services/RegistrationService';
import studentRegistrationService from '../services/StudentRegistrationService';
import student from '../services/student.service';
import { toast } from 'react-hot-toast';
import { Career } from '../models/Career';
import { Student } from '../models/student';

export default function RegistrationPage() {
    const [studentsData, setStudentsData] = useState<Student[]>([]);
    const [careersData, setCareersData] = useState<Career[]>([]);
    const [registrationsData, setRegistrationsData] = useState<any[]>([]);
    const [filteredTableData, setFilteredTableData] = useState<Record<string, any>[]>([]);
    const [loading, setLoading] = useState(true);

    // Modales
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);

    // Datos del modal
    const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);

    // Formulario de matrícula/edición
    const [formData, setFormData] = useState({
        studentId: '',
        careerId: '',
        admissionPeriod: new Date().toISOString().split('T')[0],
        academicStatus: 'ACTIVE',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dateError, setDateError] = useState('');

    // Columnas y acciones para GenericTable
    const tableColumns = [
        { key: 'student_name', label: 'Estudiante' },
        { key: 'career_name', label: 'Carrera' },
        { key: 'admission_period', label: 'Período de Ingreso' },
        { key: 'status', label: 'Estado' },
    ];

    const columns = tableColumns;

    const actions = [
        { name: 'view', label: 'Ver' },
        { name: 'edit', label: 'Editar' },
        { name: 'status', label: 'Cambiar Estado' },
    ];

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


                const students = (studentsRes?.data as Student[]) || [];
                const careers = careersRes || [];
                const regs = registrations || [];

                console.log('Loaded Students:', students);
                console.log('Student IDs:', students.map(s => ({ id: s.id, name: `${s.profile?.first_name} ${s.profile?.last_name}` })));
                console.log('Loaded Careers:', careers);
                console.log('Loaded Registrations:', regs);
                console.log('Registration student_ids:', regs.map(r => r.student_id));

                setStudentsData(students);
                setCareersData(careers);
                setRegistrationsData(regs);
            } catch (error) {
                console.error('Error cargando datos:', error);
                toast.error('Error cargando los datos');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Transformar datos cuando cambian estudiantes, carreras o matrículas
    useEffect(() => {
        if (studentsData.length > 0 && careersData.length > 0 && registrationsData.length > 0) {
            transformTableData(registrationsData);
        } else if (registrationsData.length === 0) {
            setFilteredTableData([]);
        }
    }, [studentsData, careersData, registrationsData]);

    // Transformar datos para la tabla
    const transformTableData = (registrations: any[]) => {
        const transformed = registrations.map(reg => {
            const stud = studentsData.find(s => s.profile?.id === reg.student_id);
            const career = careersData.find(c => c.id === reg.career_id);

            return {
                id: reg.id,
                student_name: stud
                    ? ((stud as any).name || `${stud.profile?.first_name || ''} ${stud.profile?.last_name || ''}`.trim() || 'Sin nombre')
                    : 'Sin nombre',
                career_name: career?.name || '-',
                admission_period: reg.admission_period
                    ? new Date(reg.admission_period).toLocaleDateString('es-ES')
                    : '-',
                status: reg.is_active ? 'Activo' : 'Retirado',
                status_color: reg.is_active ? 'green' : 'red',
                student_id: reg.student_id,
                career_id: reg.career_id,
                is_active: reg.is_active,
                admission_period_raw: reg.admission_period,
            };
        });
        console.table(transformed);
        setFilteredTableData(transformed);
    };

    // Recargar registraciones
    const loadRegistrations = async () => {
        try {
            const registrations = await registrationService.getRegistrations();
            setRegistrationsData(registrations || []);
        } catch (error) {
            console.error('Error cargando matrículas:', error);
        }
    };

    // Validar formato de fecha (YYYY-MM-DD)
    const validateDate = (dateString: string): boolean => {
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(dateString)) {
            setDateError('Formato de fecha inválido (YYYY-MM-DD)');
            return false;
        }

        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            setDateError('Fecha inválida');
            return false;
        }

        setDateError('');
        return true;
    };

    // Validar matrícula duplicada
    const checkDuplicateEnrollment = (studentId: string, careerId: string): boolean => {
        const existingEnrollment = registrationsData.find(
            r => r.student_id === studentId &&
                r.career_id === careerId &&
                r.is_active === true
        );

        if (existingEnrollment) {
            toast.error('El estudiante ya tiene una matrícula activa en esta carrera');
            return false;
        }

        return true;
    };

    // Abrir modal de matrícula
    const handleOpenEnrollModal = () => {
        setFormData({
            studentId: '',
            careerId: '',
            admissionPeriod: new Date().toISOString().split('T')[0],
            academicStatus: 'ACTIVE',
        });
        setDateError('');
        setShowEnrollModal(true);
    };

    // Crear matrícula
    const handleEnrollStudent = async () => {
        // Validar campos
        if (!formData.studentId || !formData.careerId || !formData.admissionPeriod) {
            toast.error('Por favor completa todos los campos requeridos');
            return;
        }

        // Validar fecha
        if (!validateDate(formData.admissionPeriod)) {
            return;
        }

        // Validar matrícula duplicada
        if (!checkDuplicateEnrollment(formData.studentId, formData.careerId)) {
            return;
        }

        try {
            setIsSubmitting(true);
            const result = await studentRegistrationService.registerStudentToCareer({
                studentId: formData.studentId,
                careerId: formData.careerId,
                admissionPeriod: formData.admissionPeriod,
                academicStatus: formData.academicStatus,
            });

            if (result?.success) {
                const stud = studentsData.find(s => s.id === formData.studentId);
                toast.success(`${stud?.profile?.first_name || 'Estudiante'} matriculado(a) correctamente`);
                setShowEnrollModal(false);
                await loadRegistrations();
            } else {
                toast.error(result?.error || 'Error al matricular estudiante');
            }
        } catch (error: any) {
            console.error('Error matriculando estudiante:', error);
            toast.error(error?.message || 'Error al matricular estudiante');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Manejar acciones de la tabla
    const handleAction = useCallback((action: string, item: Record<string, any>) => {
        console.log('ACTION:', action, 'ITEM:', JSON.stringify(item));
        const registration = registrationsData.find(r => r.id === item.id);
        if (!registration) {
            toast.error('Registro no encontrado');
            return;
        }
        const stud = studentsData.find(s => s.profile?.id === registration.student_id);
        const career = careersData.find(c => c.id === registration.career_id);
        setSelectedRegistration(registration);
        setSelectedStudent(stud || null);
        setSelectedCareer(career || null);
        switch (action) {
            case 'view':
                console.log('Opening detail modal...');
                setShowDetailModal(true);
                break;
            case 'edit':
                console.log('Opening edit modal...');
                setFormData({
                    studentId: item.student_id,
                    careerId: item.career_id,
                    admissionPeriod: item.admission_period_raw || new Date().toISOString().split('T')[0],
                    academicStatus: item.is_active ? 'ACTIVE' : 'INACTIVE',
                });
                setShowEditModal(true);
                break;
            case 'status':
                console.log('Opening status modal...');
                setShowStatusModal(true);
                break;
        }
    }, [registrationsData, studentsData, careersData]);

    // Actualizar matrícula
    const handleEditEnrollment = async () => {
        if (!formData.studentId || !formData.careerId || !formData.admissionPeriod) {
            toast.error('Por favor completa todos los campos requeridos');
            return;
        }

        if (!validateDate(formData.admissionPeriod)) {
            return;
        }

        try {
            setIsSubmitting(true);
            // Actualizar todos los campos de la matrícula
            const result = await registrationService.updateRegistration(selectedRegistration?.id, {
                student_id: formData.studentId,
                career_id: formData.careerId,
                admission_period: formData.admissionPeriod,
                academic_status: formData.academicStatus,
            });

            if (result) {
                toast.success('Matrícula actualizada correctamente');
                setShowEditModal(false);
                await loadRegistrations();
            } else {
                toast.error('Error al actualizar matrícula');
            }
        } catch (error: any) {
            console.error('Error actualizando matrícula:', error);
            toast.error(error?.message || 'Error al actualizar matrícula');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Cambiar estado de matrícula
    const handleChangeStatus = async (newStatus: boolean) => {
        try {
            setIsSubmitting(true);
            let result = false;

            if (newStatus) {
                // Reactivar matrícula
                result = await studentRegistrationService.updateAcademicStatus(
                    selectedRegistration?.id,
                    'ACTIVE'
                );
            } else {
                // Desactivar matrícula (cancelar)
                result = await studentRegistrationService.cancelRegistration(
                    selectedRegistration?.id
                );
            }

            if (result) {
                toast.success(newStatus ? 'Matrícula activada' : 'Matrícula desactivada');
                setShowStatusModal(false);
                await loadRegistrations();
            } else {
                toast.error('Error al cambiar estado');
            }
        } catch (error: any) {
            console.error('Error cambiando estado:', error);
            toast.error(error?.message || 'Error al cambiar estado');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="p-6 text-center">Cargando datos...</div>;
    }

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <PageHeader
                title="Matrículas de Estudiantes"
                description="Administra las matrículas de estudiantes a carreras"
                primaryAction={{
                    label: 'Matricular Estudiante',
                    onClick: handleOpenEnrollModal,
                }}
            />

            {/* GenericTable */}
            {filteredTableData.length === 0 ? (
                <div className="rounded-lg border border-gray-300 bg-white p-6 text-center shadow-default dark:border-strokedark dark:bg-boxdark">
                    <p className="text-gray-600 dark:text-gray-400">No hay matrículas registradas</p>
                </div>
            ) : (
                <GenericTable
                    columns={columns}
                    data={filteredTableData}
                    actions={actions}
                    onAction={handleAction}
                />
            )}

            {/* Modal Ver Detalles */}
            <DetailRegistrationModal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                selectedRegistration={selectedRegistration}
                selectedStudent={selectedStudent}
                selectedCareer={selectedCareer}
            />

            {/* Modal Editar Matrícula */}
            <EditRegistrationModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSave={handleEditEnrollment}
                isLoading={isSubmitting}
                formData={formData}
                onFormChange={setFormData}
                students={studentsData}
                careers={careersData}
                dateError={dateError}
            />

            {/* Modal Cambiar Estado */}
            <ChangeRegistrationStatusModal
                isOpen={showStatusModal}
                onClose={() => setShowStatusModal(false)}
                onConfirm={handleChangeStatus}
                isLoading={isSubmitting}
                selectedStudent={selectedStudent}
                isActive={selectedRegistration?.is_active || false}
            />

            {/* Modal Matricular Estudiante */}
            <EnrollRegistrationModal
                isOpen={showEnrollModal}
                onClose={() => setShowEnrollModal(false)}
                onSave={handleEnrollStudent}
                isLoading={isSubmitting}
                formData={formData}
                onFormChange={setFormData}
                students={studentsData}
                careers={careersData}
                dateError={dateError}
            />
        </div>
    );
}
