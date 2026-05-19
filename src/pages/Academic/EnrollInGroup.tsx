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
import { careerService } from '../../services/CareerService';
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

  const [groups, setGroups] = useState<Group[]>([]);
  const [groupSubjectsMap, setGroupSubjectsMap] = useState<Record<string, any>>({});
  const [groupEnrollmentCountMap, setGroupEnrollmentCountMap] = useState<Record<string, number>>({});
  const [selectedGroups, setSelectedGroups] = useState<Record<string, boolean>>({});
  const [currentCredits, setCurrentCredits] = useState<number>(0);
  
  const [allowedGroupIds, setAllowedGroupIds] = useState<Set<string>>(new Set());
  const [currentEnrollments, setCurrentEnrollments] = useState<any[]>([]);
  const [isCancelling, setIsCancelling] = useState(false);
  const [careerMap, setCareerMap] = useState<Record<string, any>>({});

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
    const academicStudentId = student.profile?.id || student.id;
    const activeSem = await semesterService.getActiveSemester();

    // load active registrations for student
    const regs = await registrationService.getActiveRegistrationsByStudent(academicStudentId);
    setRegistrations(regs || []);
    
    // Load career information for all registrations
    const newCareerMap: Record<string, any> = {};
    for (const reg of regs || []) {
      if (reg.career_id && !newCareerMap[reg.career_id]) {
        const career = await careerService.getCareerById(reg.career_id);
        if (career) {
          newCareerMap[reg.career_id] = career;
        }
      }
    }
    setCareerMap(newCareerMap);
    
    // load current enrollments to show what's already enrolled
    const currentEnrols = await enrollmentService.getActiveEnrollmentsByStudent(academicStudentId);
    setCurrentEnrollments(currentEnrols || []);

    
    
    // load current enrolled credits
    const credits = await enrollmentService.getTotalCreditsEnrolled(academicStudentId);
    setCurrentCredits(credits || 0);

    // prepare group -> subject info map AND count enrollments per group
    const map: Record<string, any> = {};
    const countMap: Record<string, number> = {};
    for (const g of groups) {
      const subj = await subjectService.getSubjectById(g.subject_id);
      map[g.id] = subj || null;
      
      // Count current enrollments for this group
      const groupEnrols = await enrollmentService.getEnrollmentsByGroup(g.id);
      countMap[g.id] = (groupEnrols || []).filter(e => e.status === 'ACTIVE').length;
    }
    setGroupSubjectsMap(map);
    setGroupEnrollmentCountMap(countMap);

    // Ensure groups list includes any groups referenced by the student's enrollments
    try {
      const existingGroupIds = new Set(groups.map(g => g.id));
      const missingGroupIds = (currentEnrols || []).
        map((e: any) => e.group_id)
        .filter((gid: string) => gid && !existingGroupIds.has(gid));

      if (missingGroupIds.length > 0) {
        const fetched: Group[] = [];
        const newMap: Record<string, any> = { ...map };
        const newCountMap: Record<string, number> = { ...countMap };

        for (const gid of missingGroupIds) {
          try {
            const g = await groupService.getGroupById(gid);
            // Include the group only if it belongs to the active semester
            if (g && activeSem && g.semester_id === activeSem.id) {
              fetched.push(g);
              const subj = await subjectService.getSubjectById(g.subject_id);
              newMap[g.id] = subj || null;
              const groupEnrols = await enrollmentService.getEnrollmentsByGroup(g.id);
              newCountMap[g.id] = (groupEnrols || []).filter((e: any) => e.status === 'ACTIVE').length;
            }
          } catch (err) {
            console.warn('[EnrollInGroup] could not fetch missing group', gid, err);
          }
        }

        if (fetched.length > 0) {
          setGroups(prev => {
            const mapPrev = new Map(prev.map(g => [g.id, g]));
            for (const fg of fetched) mapPrev.set(fg.id, fg);
            return Array.from(mapPrev.values());
          });

          setGroupSubjectsMap(newMap);
          setGroupEnrollmentCountMap(newCountMap);
        }
      }
    } catch (err) {
      console.warn('[EnrollInGroup] error ensuring missing groups', err);
    }

    // Determine which groups are allowed for this student (based on their career study plans)
    const allowedIds = new Set<string>();
    if (regs && regs.length > 0) {
      for (const reg of regs) {
        const activePlan = await studyPlanService.getActiveStudyPlan(reg.career_id);
        if (!activePlan) continue;
        const subjects = await studyPlanSubjectService.getSubjectsByStudyPlan(activePlan.id);
        const subjectIds = new Set((subjects || []).map(s => s.id));
        
        // Find all groups whose subject is in this study plan
        for (const g of groups) {
          if (subjectIds.has(g.subject_id)) {
            allowedIds.add(g.id);
          }
        }
      }
    }
    setAllowedGroupIds(allowedIds);
    setSelectedGroups({});
  };

  const ensureActiveRegistrationForGroup = async (studentId: string, groupId: string) => {
    try {
      const group = await groupService.getGroupById(groupId);
      if (!group) return;

      const regs = await registrationService.getRegistrationsByStudent(studentId);
      for (const reg of regs || []) {
        const activePlan = await studyPlanService.getActiveStudyPlan(reg.career_id);
        if (!activePlan) continue;
        const subjects = await studyPlanSubjectService.getSubjectsByStudyPlan(activePlan.id);
        if (subjects.some(s => s.id === group.subject_id)) {
          if (!reg.is_active) {
            await registrationService.updateAcademicStatus(reg.id, 'ACTIVE');
            const newRegs = await registrationService.getRegistrationsByStudent(studentId);
            setRegistrations(newRegs || []);
          }
          return;
        }
      }
    } catch (err) {
      console.warn('[EnrollInGroup] could not ensure active registration', err);
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

    const academicStudentId = selectedStudent.profile?.id || selectedStudent.id;
    const chosen = Object.keys(selectedGroups).filter(k => selectedGroups[k]);
    if (chosen.length === 0) return showToast('Error', 'Selecciona al menos un grupo', 2);

    const selectedCredits = computeSelectedCredits();
    if (currentCredits + selectedCredits > MAX_CREDITS) {
      return showToast('Error', `La suma de créditos excede el límite permitido (${currentCredits + selectedCredits} > ${MAX_CREDITS})`, 2);
    }

    // validate availability and duplicates
    for (const gid of chosen) {
      try {
        const can = await enrollmentService.canEnrollInGroup(academicStudentId, gid);
        if (!can.canEnroll) return showToast('Error', `No se puede inscribir en grupo ${gid}: ${can.reason}`, 2);
      } catch (err) {
        return showToast('Error', `Error validando grupo ${gid}`, 2);
      }
    }

    // All good: create enrollments
    try {
      for (const gid of chosen) {
        // Ensure student has an active registration for the career that contains this subject
        await ensureActiveRegistrationForGroup(academicStudentId, gid);

        // Check if there's a CANCELLED enrollment for this student and group, and delete it if it exists
        const groupEnrollments = await enrollmentService.getEnrollmentsByGroup(gid);
        const cancelledEnrollment = groupEnrollments.find(
          e => e.student_id === academicStudentId && e.status === 'CANCELLED'
        );
        if (cancelledEnrollment) {
          await enrollmentService.deleteEnrollment(cancelledEnrollment.id);
        }

        const created = await enrollmentService.createEnrollment({ student_id: academicStudentId, group_id: gid, status: 'ACTIVE' });
        if (!created) {
          return showToast('Error', `No se pudo crear la inscripción para el grupo ${gid}. Revisa la consola para más detalles.`, 2);
        }
      }
      showToast('Éxito', 'Inscripciones creadas correctamente', 0);
      
      // REFRESH: Reload all data for the student and CLEAR selected groups
      const currentEnrols = await enrollmentService.getActiveEnrollmentsByStudent(academicStudentId);
      setCurrentEnrollments(currentEnrols || []);
      
      const credits = await enrollmentService.getTotalCreditsEnrolled(academicStudentId);
      setCurrentCredits(credits || 0);
      
      // Clear selected groups after successful inscription
      setSelectedGroups({});
      
      // Update enrollment counts
      const countMap: Record<string, number> = {};
      for (const g of groups) {
        const groupEnrols = await enrollmentService.getEnrollmentsByGroup(g.id);
        countMap[g.id] = (groupEnrols || []).filter(e => e.status === 'ACTIVE').length;
      }
      setGroupEnrollmentCountMap(countMap);

      // IMPORTANT: Recalculate allowedGroupIds to prevent -1 counter bug
      // This ensures allowedGroupIds matches the new enrollment state
      // Use the SAME logic as in selectStudent()
      const regs = await registrationService.getActiveRegistrationsByStudent(academicStudentId);
      const allowedIds = new Set<string>();
      if (regs && regs.length > 0) {
        for (const reg of regs) {
          const activePlan = await studyPlanService.getActiveStudyPlan(reg.career_id);
          if (!activePlan) continue;
          const subjects = await studyPlanSubjectService.getSubjectsByStudyPlan(activePlan.id);
          const subjectIds = new Set((subjects || []).map(s => s.id));
          
          // Find all groups whose subject is in this study plan
          for (const g of groups) {
            if (subjectIds.has(g.subject_id)) {
              allowedIds.add(g.id);
            }
          }
        }
      }
      setAllowedGroupIds(allowedIds);
    } catch (err: any) {
      showToast('Error', `No se pudo crear inscripciones: ${err?.message || String(err)}`, 2);
    }
  };

  const availableCount = Array.from(allowedGroupIds).filter(id => !currentEnrollments.some(e => e.group_id === id)).length;

  const handleCancelEnrollment = async (enrollmentId: string) => {
    if (!selectedStudent) return;
    
    try {
      setIsCancelling(true);
      const cancelled = await enrollmentService.cancelEnrollment(enrollmentId);
      
      if (cancelled) {
        showToast('Éxito', 'Inscripción cancelada correctamente', 0);
        
        // Recarga los datos del estudiante
        const academicStudentId = selectedStudent.profile?.id || selectedStudent.id;
        const currentEnrols = await enrollmentService.getActiveEnrollmentsByStudent(academicStudentId);
        setCurrentEnrollments(currentEnrols || []);
        
        const credits = await enrollmentService.getTotalCreditsEnrolled(academicStudentId);
        setCurrentCredits(credits || 0);
        
        // Recalcular IDs permitidos
        const regs = await registrationService.getActiveRegistrationsByStudent(academicStudentId);
        const allowedIds = new Set<string>();
        if (regs && regs.length > 0) {
          for (const reg of regs) {
            const activePlan = await studyPlanService.getActiveStudyPlan(reg.career_id);
            if (!activePlan) continue;
            const subjects = await studyPlanSubjectService.getSubjectsByStudyPlan(activePlan.id);
            const subjectIds = new Set((subjects || []).map(s => s.id));
            for (const g of groups) {
              if (subjectIds.has(g.subject_id)) {
                allowedIds.add(g.id);
              }
            }
          }
        }
        setAllowedGroupIds(allowedIds);
      } else {
        showToast('Error', 'No se pudo cancelar la inscripción', 2);
      }
    } catch (err: any) {
      showToast('Error', `Error al cancelar: ${err?.message || String(err)}`, 2);
    } finally {
      setIsCancelling(false);
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
                filteredStudents.map(s => {
                  // Mostrar diferenciador solo si es el estudiante seleccionado y está completo
                  const availableForStudent = Array.from(allowedGroupIds).filter(id => !currentEnrollments.some(e => e.group_id === id)).length;
                  const isSelectedAndComplete = selectedStudent?.id === s.id && allowedGroupIds.size > 0 && availableForStudent === 0;

                  return (
                    <div key={s.id} className={`p-2 rounded hover:bg-gray-50 cursor-pointer flex justify-between items-center ${selectedStudent?.id === s.id ? 'bg-gray-100' : ''}`} onClick={() => void selectStudent(s)}>
                      <div>
                        <div className="text-sm font-medium text-black dark:text-white">{s.profile?.first_name} {s.profile?.last_name}</div>
                        <div className="text-xs text-body dark:text-bodydark">{s.profile?.identification || '-'}</div>
                      </div>
                      {isSelectedAndComplete && (
                        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded font-medium">Completo</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h3 className="font-medium text-black dark:text-white mb-3">Datos del estudiante</h3>
            {selectedStudent ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 border-b pb-4">
                  <div>
                    <p className="text-xs text-body dark:text-bodydark">Nombre</p>
                    <p className="text-sm font-medium text-black dark:text-white">{selectedStudent.profile?.first_name} {selectedStudent.profile?.last_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-body dark:text-bodydark">Cédula</p>
                    <p className="text-sm font-medium text-black dark:text-white">{selectedStudent.profile?.identification || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-body dark:text-bodydark">Créditos inscritos</p>
                    <p className="text-sm font-medium text-black dark:text-white">{currentCredits} / {MAX_CREDITS}</p>
                  </div>
                  <div>
                    <p className="text-xs text-body dark:text-bodydark">Grupos inscritos</p>
                    <p className="text-sm font-medium text-black dark:text-white">{currentEnrollments.length}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-body dark:text-bodydark font-medium mb-2">Matrículas activas</p>
                  {registrations.length > 0 ? (
                    <div className="space-y-2">
                      {registrations.map((reg, idx) => {
                        const career = careerMap[reg.career_id];
                        const careerCode = career?.code || 'Unknown';
                        return (
                          <div key={reg.id} className="text-sm bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-800">
                            <div className="font-medium text-blue-900 dark:text-blue-100">Carrera {idx + 1}: {careerCode}</div>
                            <div className="text-xs text-blue-800 dark:text-blue-200">Estado: {reg.academic_status} {reg.is_active && '✓'}</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                      ⚠️ No tiene matrículas registradas. Contacte con admisión.
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* SECCIÓN 1: Grupos ya inscritos */}
                  {currentEnrollments.length > 0 && (
                    <div>
                      <p className="text-xs text-body dark:text-bodydark font-medium mb-2">Grupos en los que ya está inscrito/a ({currentEnrollments.length})</p>
                      <div className="overflow-auto border border-green-200 dark:border-green-800 rounded bg-green-50 dark:bg-green-900/20">
                        <table className="w-full">
                          <thead className="bg-green-100 dark:bg-green-900/50 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left">Código</th>
                              <th className="px-3 py-2 text-left">Asignatura</th>
                              <th className="px-3 py-2 text-center">Créditos</th>
                              <th className="px-3 py-2 text-center">Inscritos</th>
                              <th className="px-3 py-2 text-center">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {groups
                              .filter(g => currentEnrollments.some(e => e.group_id === g.id))
                              .map(g => {
                                const enrolled = groupEnrollmentCountMap[g.id] || 0;
                                const enrollment = currentEnrollments.find(e => e.group_id === g.id);
                                return (
                                  <tr key={g.id} className="border-t">
                                    <td className="px-3 py-2 text-sm font-medium">{g.group_code}</td>
                                    <td className="px-3 py-2 text-sm">{groupSubjectsMap[g.id]?.name || '-'}</td>
                                    <td className="px-3 py-2 text-center text-sm">{groupSubjectsMap[g.id]?.credits || '-'}</td>
                                    <td className="px-3 py-2 text-center text-sm">
                                      {enrolled}/{g.capacity}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      {enrollment && (
                                        <button
                                          type="button"
                                          onClick={() => handleCancelEnrollment(enrollment.id)}
                                          disabled={isCancelling}
                                          className={`text-xs px-2 py-1 rounded font-medium text-black bg-red-100 hover:bg-red-200 disabled:opacity-50 transition dark:bg-red-700 dark:text-white dark:hover:bg-red-600 border border-red-200 dark:border-red-600`}
                                          title="Cancelar inscripción"
                                        >
                                          {isCancelling ? 'Cancelando...' : 'Cancelar'}
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* SECCIÓN 2: Grupos disponibles */}
                  <div>
                    <p className="text-xs text-body dark:text-bodydark font-medium mb-2">
                      Grupos disponibles para inscribirse ({availableCount})
                    </p>
                    <div className="overflow-auto max-h-[35vh] border border-stroke rounded bg-white dark:bg-boxdark">
                      {availableCount === 0 && allowedGroupIds.size > 0 ? (
                        <div className="p-4 text-sm text-body dark:text-bodydark text-center bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                          ✓ Este estudiante está inscrito en todos los grupos disponibles
                        </div>
                      ) : allowedGroupIds.size === 0 ? (
                        <div className="p-4 text-sm text-body dark:text-bodydark text-center">
                          No hay grupos disponibles para las carreras de este estudiante
                        </div>
                      ) : (
                        <table className="w-full">
                          <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left">Sel</th>
                              <th className="px-3 py-2 text-left">Código</th>
                              <th className="px-3 py-2 text-left">Asignatura</th>
                              <th className="px-3 py-2 text-center">Créditos</th>
                              <th className="px-3 py-2 text-center">Inscritos</th>
                            </tr>
                          </thead>
                          <tbody>
                            {groups
                              .filter(g => allowedGroupIds.has(g.id) && !currentEnrollments.some(e => e.group_id === g.id))
                              .map(g => {
                                const enrolled = groupEnrollmentCountMap[g.id] || 0;
                                const isFull = enrolled >= (g.capacity || 0);
                                
                                return (
                                  <tr key={g.id} className={`border-t ${isFull ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                                    <td className="px-3 py-2">
                                      <input 
                                        type="checkbox" 
                                        checked={!!selectedGroups[g.id]} 
                                        onChange={() => !isFull && toggleGroup(g.id)}
                                        disabled={isFull}
                                        title={isFull ? 'Grupo lleno' : ''}
                                      />
                                    </td>
                                    <td className="px-3 py-2 text-sm font-medium">{g.group_code}</td>
                                    <td className="px-3 py-2 text-sm">
                                      {groupSubjectsMap[g.id]?.name || '-'}
                                      {isFull && <span className="ml-2 text-xs bg-red-200 text-red-800 px-2 py-1 rounded">Lleno</span>}
                                    </td>
                                    <td className="px-3 py-2 text-center text-sm">{groupSubjectsMap[g.id]?.credits || '-'}</td>
                                    <td className="px-3 py-2 text-center text-sm">
                                      {enrolled}/{g.capacity}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 flex justify-end gap-3">
                  <button 
                    className="rounded border border-stroke px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700" 
                    onClick={() => { setSelectedStudent(null); setSelectedGroups({}); setCurrentEnrollments([]); }}
                  >
                    Cancelar
                  </button>
                  <button 
                    className={`rounded px-4 py-2 text-sm font-medium text-white ${Object.values(selectedGroups).some(v => v) ? 'bg-primary hover:opacity-90' : 'bg-gray-400 cursor-not-allowed'}`}
                    onClick={handleConfirmEnroll}
                    disabled={!Object.values(selectedGroups).some(v => v)}
                  >
                    Confirmar inscripción ({Object.values(selectedGroups).filter(v => v).length})
                  </button>
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