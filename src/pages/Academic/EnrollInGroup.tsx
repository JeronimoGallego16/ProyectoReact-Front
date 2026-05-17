import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import FilterTable from '../../components/FilterTable';
import studentService from '../../services/student.service';
import { registrationService } from '../../services/RegistrationService';
import { semesterService } from '../../services/SemesterService';
import { groupService } from '../../services/GroupService';
import { studyPlanService } from '../../services/StudyPlanService';
import { studyPlanSubjectService } from '../../services/StudyPlanSubjectService';
import { subjectService } from '../../services/SubjectService';
import { enrollmentService } from '../../services/EnrollmentService';
import { Student } from '../../models/student';
import { Group } from '../../models/Group';
import { showToast } from '../../hooks/fireToast';

const MAX_CREDITS = 18; // keep in sync with backend logic

const EnrollInGroupPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [activeRegistration, setActiveRegistration] = useState<any | null>(null);

  const [groups, setGroups] = useState<Group[]>([]);
  const [groupSubjectsMap, setGroupSubjectsMap] = useState<Record<string, any>>({});
  const [selectedGroups, setSelectedGroups] = useState<Record<string, boolean>>({});
  const [currentCredits, setCurrentCredits] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const studentsRes = await studentService.getAllStudents();
        setStudents((studentsRes?.data as Student[]) || []);
        const regs = await registrationService.getRegistrations();
        setRegistrations(regs || []);
      } catch (err) {
        console.error(err);
        showToast('Error', 'No se pudieron cargar los datos iniciales', 2);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const activeSem = await semesterService.getActiveSemester();
        if (!activeSem) return setGroups([]);
        const allGroups = await groupService.getGroupsBySemester(activeSem.id);
        setGroups(allGroups || []);
      } catch (err) {
        console.error(err);
      }
    };
    void loadGroups();
  }, []);

  const handleFilterChange = (f: Record<string, string>) => setFilters(f);

  const filteredStudents = students.filter(s => {
    const fullName = `${s.profile?.first_name || ''} ${s.profile?.last_name || ''}`.toLowerCase();
    const search = (filters.search || '').toLowerCase();
    return fullName.includes(search) || (s.profile?.identification || '').toLowerCase().includes(search);
  });

  const selectStudent = async (student: Student) => {
    setSelectedStudent(student);
    // load active registrations for student
    const regs = await registrationService.getActiveRegistrationsByStudent(student.id);
    setRegistrations(regs || []);
    setActiveRegistration(regs && regs.length > 0 ? regs[0] : null);

    // load current enrolled credits
    const credits = await enrollmentService.getTotalCreditsEnrolled(student.id);
    setCurrentCredits(credits || 0);

    // prepare group -> subject info map
    const map: Record<string, any> = {};
    for (const g of groups) {
      const subj = await subjectService.getSubjectById(g.subject_id);
      map[g.id] = subj || null;
    }
    setGroupSubjectsMap(map);
    setSelectedGroups({});
    // Diagnostic logging to help debug enrollment issues
    try {
      console.debug('[EnrollInGroup] selected student registrations:', regs);
      for (const reg of regs || []) {
        const activePlan = await studyPlanService.getActiveStudyPlan(reg.career_id);
        console.debug(`[EnrollInGroup] registration ${reg.id} -> activePlan:`, activePlan);
        if (activePlan) {
          const subjects = await studyPlanSubjectService.getSubjectsByStudyPlan(activePlan.id);
          console.debug(`[EnrollInGroup] subjects in active plan ${activePlan.id}:`, subjects.map(s => s.id));
        }
      }
    } catch (diagErr) {
      console.warn('[EnrollInGroup] diagnostic error', diagErr);
    }
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const computeSelectedCredits = () => {
    let sum = 0;
    for (const gid of Object.keys(selectedGroups)) {
      if (!selectedGroups[gid]) continue;
      const subj = groupSubjectsMap[gid];
      if (subj && subj.credits) sum += subj.credits;
    }
    return sum;
  };

  const handleConfirmEnroll = async () => {
    if (!selectedStudent) return showToast('Error', 'Selecciona un estudiante', 2);
    if (!activeRegistration) return showToast('Error', 'El estudiante no tiene matrícula activa', 2);

    const chosen = Object.keys(selectedGroups).filter(k => selectedGroups[k]);
    if (chosen.length === 0) return showToast('Error', 'Selecciona al menos un grupo', 2);

    const selectedCredits = computeSelectedCredits();
    if (currentCredits + selectedCredits > MAX_CREDITS) {
      return showToast('Error', `La suma de créditos excede el límite permitido (${currentCredits + selectedCredits} > ${MAX_CREDITS})`, 2);
    }

    // validate availability and duplicates
    for (const gid of chosen) {
      try {
        const can = await enrollmentService.canEnrollInGroup(selectedStudent.id, gid);
        if (!can.canEnroll) return showToast('Error', `No se puede inscribir en grupo ${gid}: ${can.reason}`, 2);
      } catch (err) {
        return showToast('Error', `Error validando grupo ${gid}`, 2);
      }
    }

    // All good: create enrollments
    try {
      for (const gid of chosen) {
        const created = await enrollmentService.createEnrollment({ student_id: selectedStudent.id, group_id: gid, status: 'ACTIVE' });
        if (!created) {
          // createEnrollment returns null on failure and logs details to console
          console.error(`[EnrollInGroup] createEnrollment failed for student ${selectedStudent.id} group ${gid}`);
          return showToast('Error', `No se pudo crear la inscripción para el grupo ${gid}. Revisa la consola para más detalles.`, 2);
        }
      }
      showToast('Éxito', 'Inscripciones creadas correctamente', 0);
      // refresh
      const credits = await enrollmentService.getTotalCreditsEnrolled(selectedStudent.id);
      setCurrentCredits(credits || 0);
      setSelectedGroups({});
    } catch (err: any) {
      showToast('Error', `No se pudo crear inscripciones: ${err?.message || String(err)}`, 2);
    }
  };

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <PageHeader title="Inscribir estudiante en grupo" description="Inscribir a un estudiante en los grupos del semestre activo" />

      <div className="mb-4">
        <FilterTable
          filters={[{ id: 'search', label: 'Buscar Estudiante', placeholder: 'Nombre, apellido o cédula...', type: 'text' }]}
          onFilterChange={handleFilterChange}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h3 className="font-medium text-black dark:text-white mb-3">Estudiantes</h3>
            <div className="max-h-[60vh] overflow-auto">
              {loading ? (
                <div className="text-sm text-body dark:text-bodydark">Cargando estudiantes...</div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-sm text-body dark:text-bodydark">No se encontraron estudiantes.</div>
              ) : (
                filteredStudents.map(s => (
                  <div key={s.id} className={`p-2 rounded hover:bg-gray-50 cursor-pointer ${selectedStudent?.id === s.id ? 'bg-gray-100' : ''}`} onClick={() => void selectStudent(s)}>
                    <div className="text-sm font-medium text-black dark:text-white">{s.profile?.first_name} {s.profile?.last_name}</div>
                    <div className="text-xs text-body dark:text-bodydark">{s.profile?.identification || '-'}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h3 className="font-medium text-black dark:text-white mb-3">Datos del estudiante</h3>
            {selectedStudent ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div>
                    <p className="text-xs text-body dark:text-bodydark">Nombre</p>
                    <p className="text-sm text-black dark:text-white">{selectedStudent.profile?.first_name} {selectedStudent.profile?.last_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-body dark:text-bodydark">Créditos inscritos</p>
                    <p className="text-sm text-black dark:text-white">{currentCredits}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-body dark:text-bodydark">Matrículas activas</p>
                  {registrations.length > 0 ? (
                    <div className="space-y-2">
                      {registrations.map(reg => (
                        <div key={reg.id} className="text-sm text-black dark:text-white">
                          Carrera: {reg.career_id} — Estado: {reg.academic_status} — Activa: {reg.is_active ? 'Sí' : 'No'}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-body dark:text-bodydark">No tiene matrícula activa</div>
                  )}
                </div>

                <div>
                  <p className="text-xs text-body dark:text-bodydark">Grupos disponibles (semestre activo)</p>
                  <div className="overflow-auto max-h-[40vh] mt-2">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left">Sel</th>
                          <th className="px-3 py-2 text-left">Código Grupo</th>
                          <th className="px-3 py-2 text-left">Asignatura</th>
                          <th className="px-3 py-2 text-left">Cupo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groups.map(g => (
                          <tr key={g.id} className="border-t">
                            <td className="px-3 py-2">
                              <input type="checkbox" checked={!!selectedGroups[g.id]} onChange={() => toggleGroup(g.id)} />
                            </td>
                            <td className="px-3 py-2">{g.group_code}</td>
                            <td className="px-3 py-2">{groupSubjectsMap[g.id]?.name || '-'}</td>
                            <td className="px-3 py-2">{g.capacity || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button className="rounded border border-stroke px-4 py-2 text-sm" onClick={() => { setSelectedStudent(null); setSelectedGroups({}); }}>
                    Cancelar
                  </button>
                  <button className="rounded bg-primary px-4 py-2 text-sm text-white" onClick={handleConfirmEnroll}>Confirmar inscripción</button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-body dark:text-bodydark">Selecciona un estudiante para ver opciones de inscripción.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollInGroupPage;