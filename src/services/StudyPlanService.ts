import apiService from './api';
import { StudyPlan, StudyPlanCreateInput, StudyPlanUpdateInput } from '../models/StudyPlan';
import { studyPlanSubjectService } from './StudyPlanSubjectService';

const API_URL = '/academic/study-plans';

class StudyPlanService {
  // Método para obtener todos los planes de estudio.
  async getStudyPlans(): Promise<StudyPlan[]> {
    try {
      const res = await apiService.get<StudyPlan[]>(API_URL);
      if (!res || !res.success) return [];
      const data = res.data ?? [];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return this._handleError(error) || [];
    }
  }

  async getPublishedStudyPlansByCareer(careerId: string): Promise<StudyPlan[]> {
    try {
      const plans = await this.getStudyPlansByCareer(careerId);
      return plans.filter(plan => plan.is_published);
    } catch (error) {
      return this._handleError(error) || [];
    }
  }

  // Método para obtener planes de estudio por carrera.
  async getStudyPlansByCareer(careerId: string): Promise<StudyPlan[]> {
    try {
      const plans = await this.getStudyPlans();
      return plans.filter(p => p.career_id === careerId);
    } catch (error) {
      return this._handleError(error) || [];
    }
  }

  // Método para obtener el plan de estudio vigente (mayor año publicado) de una carrera.
  async getActiveStudyPlan(careerId: string): Promise<StudyPlan | null> {
    try {
      const plans = await this.getStudyPlansByCareer(careerId);
      const published = plans.filter(p => p.is_published).sort((a, b) => b.year - a.year);
      return published[0] || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para obtener un plan de estudio por ID.
  async getStudyPlanById(id: string): Promise<StudyPlan | null> {
    try {
      const res = await apiService.get<StudyPlan>(`${API_URL}/${id}`);
      if (!res || !res.success) return this._handleError(new Error(res?.error)) || null;
      return (res.data as StudyPlan) || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para crear un plan de estudio (versión de carrera).
  // El plan inicia como borrador (is_published=false).
  // Las asignaturas se vinculan a través de StudyPlanSubjectService.
  async createStudyPlan(payload: StudyPlanCreateInput): Promise<StudyPlan | null> {
    try {
      if (!payload.career_id || !payload.name) {
        throw new Error('Career and name are required');
      }

      if (!Number.isInteger(payload.year) || payload.year <= 0) {
        throw new Error('Year must be a positive integer');
      }

      if (!Number.isInteger(payload.suggested_semester) || payload.suggested_semester <= 0) {
        throw new Error('Suggested semester must be a positive integer');
      }

      const res = await apiService.post<StudyPlan>(API_URL, payload);
      if (!res || !res.success) return this._handleError(new Error(res?.error)) || null;
      return (res.data as StudyPlan) || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para actualizar un plan de estudio.
  async updateStudyPlan(id: string, payload: StudyPlanUpdateInput): Promise<StudyPlan | null> {
    try {
      const res = await apiService.put<StudyPlan>(`${API_URL}/${id}`, payload);
      if (!res || !res.success) return this._handleError(new Error(res?.error)) || null;
      return (res.data as StudyPlan) || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para publicar un plan de estudio (marcar como versión vigente).
  // Solo se puede publicar si tiene al menos una asignatura vinculada.
  async publishStudyPlan(id: string): Promise<StudyPlan | null> {
    try {
      const plan = await this.getStudyPlanById(id);
      if (!plan) {
        throw new Error('Study plan not found');
      }

      if (plan.is_published) {
        console.warn(`Study plan ${id} is already published`);
        return plan;
      }

      // Validar que tenga al menos una asignatura vinculada
      const subjects = await studyPlanSubjectService.getSubjectsByStudyPlan(id);
      if (subjects.length === 0) {
        throw new Error('Cannot publish a study plan without any subjects');
      }

      if (!Number.isInteger(plan.year) || plan.year <= 0) {
        throw new Error('Study plan year is invalid');
      }

      return await this.updateStudyPlan(id, { is_published: true });
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para obtener el historial de versiones de un plan por carrera.
  async getPlanVersionHistory(careerId: string): Promise<StudyPlan[]> {
    try {
      const plans = await this.getStudyPlansByCareer(careerId);
      return plans.sort((a, b) => b.year - a.year);
    } catch (error) {
      return this._handleError(error) || [];
    }
  }

  // Método para eliminar un plan de estudio (solo si está en borrador).
  async deleteStudyPlan(id: string): Promise<boolean> {
    try {
      const plan = await this.getStudyPlanById(id);
      if (plan && plan.is_published) {
        throw new Error('Cannot delete a published study plan');
      }

      const res = await apiService.delete(`${API_URL}/${id}`);
      if (!res || !res.success) {
        this._handleError(new Error(res?.error));
        return false;
      }
      return true;
    } catch (error) {
      this._handleError(error);
      return false;
    }
  }
  private _handleError(error: any): any {
    if (error.response?.data?.error) {
      console.error('Study plan error:', error.response.data.error);
    } else {
      console.error('Study plan error:', error.message);
    }
    return null;
  }
}

export const studyPlanService = new StudyPlanService();
