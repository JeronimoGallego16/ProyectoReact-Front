import apiService from './api';
import { Enrollment, EnrollmentCreateInput, EnrollmentUpdateInput } from '../models/Enrollment';
import { groupService } from './GroupService';
import { registrationService } from './RegistrationService';
import { semesterService } from './SemesterService';
import { studyPlanService } from './StudyPlanService';
import { studyPlanSubjectService } from './StudyPlanSubjectService';
import { subjectService } from './SubjectService';

const API_URL = '/academic/enrollments';

class EnrollmentService {
  private MAX_CREDITS = 18; // Límite máximo de créditos por semestre

  // Método para obtener todas las inscripciones.
  async getEnrollments(): Promise<Enrollment[]> {
    try {
      const res = await apiService.get<Enrollment[]>(API_URL);
      if (!res || !res.success) return [];
      const data = res.data ?? [];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return this._handleError(error) || [];
    }
  }

  // Método para obtener inscripciones de un estudiante.
  async getEnrollmentsByStudent(studentId: string): Promise<Enrollment[]> {
    try {
      const enrollments = await this.getEnrollments();
      return enrollments.filter(e => e.student_id === studentId);
    } catch (error) {
      return this._handleError(error) || [];
    }
  }

  // Método para obtener inscripciones activas de un estudiante en el semestre actual.
  async getActiveEnrollmentsByStudent(studentId: string): Promise<Enrollment[]> {
    try {
      const enrollments = await this.getEnrollmentsByStudent(studentId);
      return enrollments.filter(e => e.status === 'ACTIVE');
    } catch (error) {
      return this._handleError(error) || [];
    }
  }

  // Método para obtener inscripciones de un grupo.
  async getEnrollmentsByGroup(groupId: string): Promise<Enrollment[]> {
    try {
      const enrollments = await this.getEnrollments();
      return enrollments.filter(e => e.group_id === groupId);
    } catch (error) {
      return this._handleError(error) || [];
    }
  }

  // Método para obtener una inscripción por ID.
  async getEnrollmentById(id: string): Promise<Enrollment | null> {
    try {
      const res = await apiService.get<Enrollment>(`${API_URL}/${id}`);
      if (!res || !res.success) return this._handleError(new Error(res?.error)) || null;
      return (res.data as Enrollment) || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  private async getCareerRegistrationForGroup(studentId: string, subjectId: string): Promise<{ careerId: string; registrationId: string } | null> {
    try {
      const activeRegistrations = await registrationService.getActiveRegistrationsByStudent(studentId);

      for (const registration of activeRegistrations) {
        const activeStudyPlan = await studyPlanService.getActiveStudyPlan(registration.career_id);
        if (!activeStudyPlan) {
          continue;
        }

        const subjects = await studyPlanSubjectService.getSubjectsByStudyPlan(activeStudyPlan.id);
        if (subjects.some(subject => subject.id === subjectId)) {
          return {
            careerId: registration.career_id,
            registrationId: registration.id,
          };
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // Método para crear una nueva inscripción.
  // Validaciones obligatorias:
  // 1. Estudiante tiene matrícula activa.
  // 2. Asignatura del grupo está en el plan de estudios.
  // 3. Suma de créditos respeta límite.
  // 4. El estudiante no está ya inscrito en este grupo.
  // 5. El grupo tiene cupo disponible.
  async createEnrollment(payload: EnrollmentCreateInput): Promise<Enrollment | null> {
    try {
      if (!payload.student_id || !payload.group_id) {
        throw new Error('Student ID and Group ID are required');
      }

      const group = await groupService.getGroupById(payload.group_id);
      if (!group) {
        throw new Error('Group not found');
      }

      const activeSemester = await semesterService.getActiveSemester();
      if (!activeSemester || group.semester_id !== activeSemester.id) {
        throw new Error('Group does not belong to the active semester');
      }

      // Obtener semestre del grupo para buscar matrícula en esa carrera
      // (En un escenario real, necesitaríamos hacer una llamada extra para obtener
      // la relación semestre->carrera o esta información desde el backend)
      
      // 1. Validar matrícula activa (simplificado: asumimos que se pasa desde el context)
      // En implementación real, necesitamos saber a qué carrera pertenece el grupo
      
      // 2. Validar que la asignatura esté en el plan (requiere backend support)
      const subject = await subjectService.getSubjectById(group.subject_id);
      if (!subject) {
        throw new Error('Subject not found');
      }

      const careerRegistration = await this.getCareerRegistrationForGroup(payload.student_id, group.subject_id);
      if (!careerRegistration) {
        throw new Error('Student does not have an active registration for a career whose study plan includes this subject');
      }

      // 3. Validar límite de créditos
      const currentEnrollments = await this.getActiveEnrollmentsByStudent(payload.student_id);
      let totalCredits = subject.credits;
      for (const enrollment of currentEnrollments) {
        const enrolledGroup = await groupService.getGroupById(enrollment.group_id);
        if (enrolledGroup) {
          const enrolledSubject = await subjectService.getSubjectById(enrolledGroup.subject_id);
          if (enrolledSubject) {
            totalCredits += enrolledSubject.credits;
          }
        }
      }

      if (totalCredits > this.MAX_CREDITS) {
        throw new Error(
          `Total credits (${totalCredits}) exceed maximum allowed (${this.MAX_CREDITS}). Current: ${totalCredits - subject.credits}, New: +${subject.credits}`
        );
      }

      // 4. Validar no duplicado en el mismo grupo
      const duplicate = await this.getEnrollmentsByGroup(payload.group_id);
      if (duplicate.some(e => e.student_id === payload.student_id && e.status === 'ACTIVE')) {
        throw new Error('Student is already enrolled in this group');
      }

      // 5. Validar cupo disponible
      const activeEnrollments = duplicate.filter(e => e.status === 'ACTIVE').length;
      const capacity = await groupService.getAvailableCapacity(payload.group_id, activeEnrollments);
      if (capacity <= 0) {
        throw new Error('Group is at full capacity');
      }

      const res = await apiService.post<Enrollment>(API_URL, payload);
      if (!res || !res.success) return this._handleError(new Error(res?.error)) || null;
      return (res.data as Enrollment) || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para actualizar una inscripción.
  async updateEnrollment(id: string, payload: EnrollmentUpdateInput): Promise<Enrollment | null> {
    try {
      const res = await apiService.put<Enrollment>(`${API_URL}/${id}`, payload);
      if (!res || !res.success) return this._handleError(new Error(res?.error)) || null;
      return (res.data as Enrollment) || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para cancelar una inscripción (antes del cierre del semestre).
  // Cambia status a CANCELLED sin eliminar el registro.
  async cancelEnrollment(enrollmentId: string): Promise<Enrollment | null> {
    try {
      return await this.updateEnrollment(enrollmentId, { status: 'CANCELLED' });
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para obtener créditos totales inscritos de un estudiante (activos).
  async getTotalCreditsEnrolled(studentId: string): Promise<number> {
    try {
      const enrollments = await this.getActiveEnrollmentsByStudent(studentId);
      let totalCredits = 0;

      for (const enrollment of enrollments) {
        const group = await groupService.getGroupById(enrollment.group_id);
        if (group) {
          const subject = await subjectService.getSubjectById(group.subject_id);
          if (subject) {
            totalCredits += subject.credits;
          }
        }
      }

      return totalCredits;
    } catch (error) {
      return this._handleError(error) || 0;
    }
  }

  // Método para verificar si el estudiante puede inscribirse en un grupo adicional (sin exceder el límite de créditos).
  async canEnrollInGroup(studentId: string, groupId: string): Promise<{
    canEnroll: boolean;
    reason: string;
    totalCreditsIfEnrolled: number;
  }> {
    try {
      const group = await groupService.getGroupById(groupId);
      if (!group) {
        return {
          canEnroll: false,
          reason: 'Group not found',
          totalCreditsIfEnrolled: 0,
        };
      }

      // Obtener la asignatura vinculada al grupo
      const subject = await subjectService.getSubjectById(group.subject_id);
      if (!subject) {
        return {
          canEnroll: false,
          reason: 'Subject not found for group',
          totalCreditsIfEnrolled: 0,
        };
      }

      // Créditos actuales del estudiante (activos)
      const currentCredits = await this.getTotalCreditsEnrolled(studentId);
      const totalIfEnrolled = currentCredits + (subject.credits || 0);

      if (totalIfEnrolled > this.MAX_CREDITS) {
        return {
          canEnroll: false,
          reason: `Exceeds credit limit: ${totalIfEnrolled} > ${this.MAX_CREDITS}`,
          totalCreditsIfEnrolled: totalIfEnrolled,
        };
      }

      // Validar cupo del grupo
      const groupEnrollments = await this.getEnrollmentsByGroup(groupId);
      const activeCount = groupEnrollments.filter(e => e.status === 'ACTIVE').length;
      if (activeCount >= (group.capacity ?? 0)) {
        return {
          canEnroll: false,
          reason: `Group is at full capacity (${activeCount}/${group.capacity})`,
          totalCreditsIfEnrolled: totalIfEnrolled,
        };
      }

      return {
        canEnroll: true,
        reason: 'Student can enroll',
        totalCreditsIfEnrolled: totalIfEnrolled,
      };
    } catch (error) {
      return {
        canEnroll: false,
        reason: 'Error validating enrollment',
        totalCreditsIfEnrolled: 0,
      };
    }
  }

  // Método para eliminar una inscripción.
  async deleteEnrollment(id: string): Promise<boolean> {
    try {
      const res = await apiService.delete(`${API_URL}/${id}`);
      return !!(res && res.success);
    } catch (error) {
      this._handleError(error);
      return false;
    }
  }
  private _handleError(error: any): any {
    if (error.response?.data?.error) {
      console.error('Enrollment error:', error.response.data.error);
    } else {
      console.error('Enrollment error:', error.message);
    }
    return null;
  }
}

export const enrollmentService = new EnrollmentService();
