// src/services/AuthorizationService.ts
import { User } from '../models/User';
import { Grade } from '../models/Grade';
import { enrollmentService } from './EnrollmentService';
import { groupService } from './GroupService';

class AuthorizationService {
  /**
   * Obtiene los IDs de materias que el usuario puede ver
   */
  async getAccessibleSubjectIds(user: User | null): Promise<string[]> {
    if (!user || user.role === 'ADMIN') return []; // Admin ve todo

    const userProfileId = user.profile?.id;
    if (!userProfileId) return [];

    if (user.role === 'STUDENT') {
      // Estudiante: materias donde está inscrito
      const enrollments = await enrollmentService.getActiveEnrollmentsByStudent(userProfileId);
      const groups = await groupService.getGroups();
      return groups
        .filter(g => enrollments.some(e => e.group_id === g.id))
        .map(g => g.subject_id);
    }

    if (user.role === 'TEACHER') {
      // Profesor: materias que dicta
      const groups = await groupService.getGroupsByTeacher(userProfileId);
      return groups.map(g => g.subject_id);
    }

    return [];
  }

  /**
   * Obtiene los IDs de grupos que el usuario puede ver
   */
  async getAccessibleGroupIds(user: User | null): Promise<string[]> {
    if (!user || user.role === 'ADMIN') return []; // Admin ve todo

    const userProfileId = user.profile?.id;
    if (!userProfileId) return [];

    if (user.role === 'STUDENT') {
      // Estudiante: grupos donde está inscrito
      const enrollments = await enrollmentService.getActiveEnrollmentsByStudent(userProfileId);
      return enrollments.map(e => e.group_id);
    }

    if (user.role === 'TEACHER') {
      // Profesor: sus grupos
      const groups = await groupService.getGroupsByTeacher(userProfileId);
      return groups.map(g => g.id);
    }

    return [];
  }

  /**
   * Obtiene los IDs de estudiantes que el usuario puede ver
   */
  async getAccessibleStudentIds(user: User | null): Promise<string[]> {
    if (!user || user.role === 'ADMIN') return []; // Admin ve todo

    const userProfileId = user.profile?.id;
    if (!userProfileId) return [];

    if (user.role === 'STUDENT') {
      // Un estudiante solo se ve a sí mismo
      return [userProfileId];
    }

    if (user.role === 'TEACHER') {
      // Profesor: estudiantes de sus grupos
      const groups = await groupService.getGroupsByTeacher(userProfileId);
      const enrollments = await enrollmentService.getEnrollments();
      return enrollments
        .filter(e => groups.some(g => g.id === e.group_id) && e.status === 'ACTIVE')
        .map(e => e.student_id);
    }

    return [];
  }

  /**
   * Verifica si el usuario puede ver una evaluación específica
   */
  async canViewEvaluation(user: User | null, subjectId: string): Promise<boolean> {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;

    const accessibleSubjects = await this.getAccessibleSubjectIds(user);
    return accessibleSubjects.includes(subjectId);
  }

  /**
   * Verifica si el usuario puede ver una rúbrica específica
   */
  async canViewRubric(user: User | null, evaluationId?: string | null, allEvaluations?: any[], rubric?: any): Promise<boolean> {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;

    // Try to resolve the evaluation if an id and evaluations list are provided
    let evaluation: any | undefined = undefined;
    if (evaluationId && Array.isArray(allEvaluations)) {
      evaluation = allEvaluations.find(e => e.id === evaluationId);
    }

    // If the rubric is not associated to an evaluation:
    // - TEACHER should be able to see it (they create/manage rubrics)
    // - STUDENT should NOT see it
    if (!evaluation) {
      if (user.role === 'TEACHER') return true;
      return false; // STUDENT or others without admin/teacher cannot see unassociated rubrics
    }

    // If rubric object is provided, enforce `is_public` visibility for STUDENT role
    if (user.role === 'STUDENT' && rubric && (rubric.is_public === false || rubric.is_public === 0)) {
      return false;
    }

    return this.canViewEvaluation(user, evaluation.subject_id);
  }

  /**
   * Verifica si el usuario puede ver las notas de un estudiante
   */
  async canViewStudentGrades(user: User | null, studentId: string): Promise<boolean> {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;

    const userProfileId = user.profile?.id;
    if (!userProfileId) return false;

    if (user.role === 'STUDENT') {
      // Un estudiante solo ve sus propias notas
      return userProfileId === studentId;
    }

    if (user.role === 'TEACHER') {
      // Un profesor ve notas de sus estudiantes
      const accessibleStudents = await this.getAccessibleStudentIds(user);
      return accessibleStudents.includes(studentId);
    }

    return false;
  }

  /**
   * Filtra notas según el rol del usuario autenticado.
   * - ADMIN: ve todas
   * - STUDENT: ve solo sus notas
   * - TEACHER: ve notas de estudiantes en sus grupos
   */
  async filterGradesByUser(user: User | null, grades: Grade[]): Promise<Grade[]> {
    if (!Array.isArray(grades) || grades.length === 0) {
      return [];
    }

    if (user?.role === 'ADMIN') {
      return grades;
    }

    const accessibleStudents = await this.getAccessibleStudentIds(user);
    if (accessibleStudents.length === 0) {
      return [];
    }

    const filtered = await Promise.all(
      grades.map(async (grade) => {
        const enrollment = await enrollmentService.getEnrollmentById(grade.enrollment_id);
        if (!enrollment) return null;

        return accessibleStudents.includes(enrollment.student_id) ? grade : null;
      })
    );

    return filtered.filter((grade): grade is Grade => grade !== null);
  }
}

export const evaluationAuthorizationService = new AuthorizationService();