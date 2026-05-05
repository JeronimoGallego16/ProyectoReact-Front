import apiClient from '../interceptor/apiClient';
import { StudyPlan, StudyPlanCreateInput, StudyPlanUpdateInput } from '../models/StudyPlan';
import { subjectService } from './SubjectService';

const API_URL = '/academic/study-plans';

class StudyPlanService {
  // Método para obtener todos los planes de estudio.
  async getStudyPlans(): Promise<StudyPlan[]> {
    try {
      const response = await apiClient.get(API_URL);
      const data = this._extractData(response);
      return Array.isArray(data) ? data : [];
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
      const response = await apiClient.get(`${API_URL}/${id}`);
      return this._extractData(response) as StudyPlan || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para crear una entrada en el plan de estudios (vincula asignatura a carrera con semestre sugerido).
  // El plan inicia como borrador (is_published=false).
  async createStudyPlan(payload: StudyPlanCreateInput): Promise<StudyPlan | null> {
    try {
      // Validar que la asignatura exista y esté activa
      const subject = await subjectService.getSubjectById(payload.subject_id);
      if (!subject || !subject.is_active) {
        throw new Error('Subject does not exist or is archived');
      }

      const response = await apiClient.post(API_URL, payload);
      return this._extractData(response) as StudyPlan || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para actualizar un plan de estudio.
  async updateStudyPlan(id: string, payload: StudyPlanUpdateInput): Promise<StudyPlan | null> {
    try {
      const response = await apiClient.put(`${API_URL}/${id}`, payload);
      return this._extractData(response) as StudyPlan || null;
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

      // Validar que tenga al menos una asignatura
      const plansByCareer = await this.getStudyPlansByCareer(plan.career_id);
      if (plansByCareer.length === 0) {
        throw new Error('Cannot publish a study plan without any subjects');
      }

      return await this.updateStudyPlan(id, { is_published: true });
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para desvincular una asignatura del plan (la elimina).
  // Solo posible si la asignatura no tiene inscripciones activas en grupos.
  async removeSubjectFromPlan(planId: string): Promise<boolean> {
    try {
      await apiClient.delete(`${API_URL}/${planId}`);
      return true;
    } catch (error) {
      this._handleError(error);
      return false;
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

  // Helpers
  private _extractData(response: any): any {
    if (!response) return null;
    if (response.data && response.data.data !== undefined) return response.data.data;
    if (response.data !== undefined) return response.data;
    return null;
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
