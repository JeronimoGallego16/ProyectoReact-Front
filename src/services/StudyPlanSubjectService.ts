import apiClient from '../interceptor/apiClient';
import { StudyPlanSubject, StudyPlanSubjectCreateInput } from '../models/StudyPlanSubject';
import { subjectService } from './SubjectService';

const API_URL = '/academic/study-plans';

class StudyPlanSubjectService {
  /**
   * Obtener todas las asignaturas de un plan de estudio
   * Endpoint: GET /academic/study-plans/{study_plan_id}/subjects
   */
  async getSubjectsByStudyPlan(studyPlanId: string): Promise<StudyPlanSubject[]> {
    try {
      const response = await apiClient.get(`${API_URL}/${studyPlanId}/subjects`);
      const data = this._extractData(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return this._handleError(error) || [];
    }
  }

  /**
   * Agregar una asignatura a un plan de estudio
   * Endpoint: POST /academic/study-plans/{study_plan_id}/subjects/{subject_id}
   */
  async addSubjectToStudyPlan(studyPlanId: string, subjectId: string): Promise<StudyPlanSubjectCreateInput> {
    try {
      // Validar que la asignatura exista y esté activa
      const subject = await subjectService.getSubjectById(subjectId);
      if (!subject || !subject.is_active) {
        throw new Error('Subject does not exist or is archived');
      }

      const response = await apiClient.post(
        `${API_URL}/${studyPlanId}/subjects/${subjectId}`
      );
      return this._extractData(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Remover una asignatura del plan de estudio
   * Endpoint: DELETE /academic/study-plans/{study_plan_id}/subjects/{subject_id}
   */
  async removeSubjectFromStudyPlan(studyPlanId: string, subjectId: string): Promise<boolean> {
    try {
      await apiClient.delete(`${API_URL}/${studyPlanId}/subjects/${subjectId}`);
      return true;
    } catch (error) {
      this._handleError(error);
      return false;
    }
  }

  // Helpers
  private _extractData(response: any): any {
    if (!response) return null;
    if (response.data && response.data.data !== undefined) return response.data.data;
    if (response.data !== undefined) return response.data;
    return null;
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
