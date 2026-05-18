import apiService from './api';
import { Subject } from '../models/Subject';
import { StudyPlan, StudyPlanSubjectDetail } from '../models/StudyPlan';
import { enrollmentService } from './EnrollmentService';
import { groupService } from './GroupService';
import { subjectService } from './SubjectService';

const API_URL = '/academic/study-plans';

class StudyPlanSubjectService {
  /**
   * Obtener todas las asignaturas de un plan de estudio
   * Endpoint: GET /academic/study-plans/{study_plan_id}/subjects
   */
  async getSubjectsByStudyPlan(studyPlanId: string): Promise<StudyPlanSubjectDetail[]> {
    try {
      const res = await apiService.get<Subject[]>(`${API_URL}/${studyPlanId}/subjects`);
      if (!res || !res.success) return [];
      const data = res.data ?? [];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return this._handleError(error) || [];
    }
  }

  async hasSubjectInStudyPlan(studyPlanId: string, subjectId: string): Promise<boolean> {
    try {
      const subjects = await this.getSubjectsByStudyPlan(studyPlanId);
      return subjects.some(subject => subject.id === subjectId);
    } catch (error) {
      return false;
    }
  }

  async canRemoveSubjectFromStudyPlan(studyPlanId: string, subjectId: string): Promise<{
    canRemove: boolean;
    reason?: string;
  }> {
    try {
      const linked = await this.hasSubjectInStudyPlan(studyPlanId, subjectId);
      if (!linked) {
        return { canRemove: false, reason: 'Subject is not linked to this study plan' };
      }

      const groups = await groupService.getGroupsBySubject(subjectId);
      for (const group of groups) {
        const enrollments = await enrollmentService.getEnrollmentsByGroup(group.id);
        if (enrollments.some(enrollment => enrollment.status === 'ACTIVE')) {
          return {
            canRemove: false,
            reason: 'Subject has active enrollments in related groups',
          };
        }
      }

      return { canRemove: true };
    } catch (error) {
      return { canRemove: false, reason: 'Error validating study plan subject removal' };
    }
  }

  /**
   * Agregar una asignatura a un plan de estudio
   * Endpoint: POST /academic/study-plans/{study_plan_id}/subjects/{subject_id}
   */
  async addSubjectToStudyPlan(studyPlanId: string, subjectId: string): Promise<StudyPlan | null> {
    try {
      // Validar que la asignatura exista y esté activa
      const subject = await subjectService.getSubjectById(subjectId);
      if (!subject || !subject.is_active) {
        throw new Error('Subject does not exist or is archived');
      }

      const alreadyLinked = await this.hasSubjectInStudyPlan(studyPlanId, subjectId);
      if (alreadyLinked) {
        throw new Error('Subject is already linked to this study plan');
      }

      const res = await apiService.post<StudyPlan>(`${API_URL}/${studyPlanId}/subjects/${subjectId}`, {});
      if (!res || !res.success) return this._handleError(new Error(res?.error)) || null;
      return (res.data as StudyPlan) || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Actualizar un campo de la relación StudyPlan<->Subject.
   */

  /**
   * Remover una asignatura del plan de estudio
   * Endpoint: DELETE /academic/study-plans/{study_plan_id}/subjects/{subject_id}
   */
  async removeSubjectFromStudyPlan(studyPlanId: string, subjectId: string): Promise<StudyPlan | null> {
    try {
      const validation = await this.canRemoveSubjectFromStudyPlan(studyPlanId, subjectId);
      if (!validation.canRemove) {
        throw new Error(validation.reason || 'Cannot remove subject from study plan');
      }

      const res = await apiService.delete<StudyPlan>(`${API_URL}/${studyPlanId}/subjects/${subjectId}`);
      if (!res || !res.success) return this._handleError(new Error(res?.error)) || null;
      return (res.data as StudyPlan) || null;
    } catch (error) {
      return this._handleError(error);
    }
  }
  private _handleError(error: any): any {
    if (error.response?.data?.error) {
      console.error('Study plan subject error:', error.response.data.error);
    } else {
      console.error('Study plan subject error:', error.message);
    }
    return null;
  }
}

export const studyPlanSubjectService = new StudyPlanSubjectService();
