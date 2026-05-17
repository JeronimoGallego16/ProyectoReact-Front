import apiService from './api';
import { Subject, SubjectCreateInput, SubjectUpdateInput } from '../models/Subject';
import { groupService } from './GroupService';
import { semesterService } from './SemesterService';

const API_URL = '/academic/subjects';

class SubjectService {
  // Método para obtener todas las asignaturas.
  async getSubjects(): Promise<Subject[]> {
    try {
      const res = await apiService.get<Subject[]>(API_URL);
      if (!res || !res.success) return [];
      const data = res.data ?? [];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return this._handleError(error) || [];
    }
  }

  // Método para obtener solo asignaturas activas (no archivadas).
  async getActiveSubjects(): Promise<Subject[]> {
    try {
      const subjects = await this.getSubjects();
      return subjects.filter(s => s.is_active);
    } catch (error) {
      return this._handleError(error) || [];
    }
  }

  async getSubjectsByCredits(credits: number): Promise<Subject[]> {
    try {
      const subjects = await this.getSubjects();
      return subjects.filter(subject => subject.credits === credits);
    } catch (error) {
      return this._handleError(error) || [];
    }
  }

  // Método para obtener una asignatura por ID.
  async getSubjectById(id: string): Promise<Subject | null> {
    try {
      const res = await apiService.get<Subject>(`${API_URL}/${id}`);
      if (!res || !res.success) return this._handleError(new Error(res?.error)) || null;
      return (res.data as Subject) || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para crear una nueva asignatura.
  // Validación: código único, créditos > 0.
  async createSubject(payload: SubjectCreateInput): Promise<Subject | null> {
    try {
      if (!payload.code || !payload.name) {
        throw new Error('Code and name are required');
      }

      if (payload.credits <= 0) {
        throw new Error('Credits must be greater than 0');
      }

      // Validar código único client-side
      const existing = await this.getSubjects();
      if (existing.some(s => s.code === payload.code)) {
        throw new Error(`Subject code "${payload.code}" already exists`);
      }

      const res = await apiService.post<Subject>(API_URL, payload);
      if (!res || !res.success) return this._handleError(new Error(res?.error)) || null;
      return (res.data as Subject) || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para actualizar una asignatura existente.
  async updateSubject(id: string, payload: SubjectUpdateInput): Promise<Subject | null> {
    try {
      if (payload.credits !== undefined && payload.credits <= 0) {
        throw new Error('Credits must be greater than 0');
      }

      const res = await apiService.put<Subject>(`${API_URL}/${id}`, payload);
      if (!res || !res.success) return this._handleError(new Error(res?.error)) || null;
      return (res.data as Subject) || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para archivar una asignatura.
  // Una asignatura archivada no puede usarse en nuevos grupos ni planes.
  async archiveSubject(id: string): Promise<Subject | null> {
    try {
      const activeSemester = await semesterService.getActiveSemester();
      const groups = await groupService.getGroupsBySubject(id);
      const hasActiveGroups = groups.some(group => group.semester_id === activeSemester?.id);
      if (hasActiveGroups) {
        throw new Error('Cannot archive a subject with active groups in the current semester');
      }

      const studyPlansRes = await apiService.get('/academic/study-plans');
      const studyPlansList = Array.isArray(studyPlansRes?.data) ? studyPlansRes.data : [];
      for (const plan of studyPlansList) {
        if (!plan?.is_published) {
          continue;
        }
        const subjectsRes = await apiService.get(`/academic/study-plans/${plan.id}/subjects`);
        const linkedSubjectsList = Array.isArray(subjectsRes?.data) ? subjectsRes.data : [];
        if (linkedSubjectsList.some((subject: Subject) => subject.id === id)) {
          throw new Error('Cannot archive a subject linked to a published study plan');
        }
      }

      return await this.updateSubject(id, { is_active: false });
    } catch (error) {
      return this._handleError(error);
    }
  }

  async reactivateSubject(id: string): Promise<Subject | null> {
    try {
      return await this.updateSubject(id, { is_active: true });
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Helpers
  private _handleError(error: any): any {
    if (error.response?.data?.error) {
      console.error('Subject error:', error.response.data.error);
    } else {
      console.error('Subject error:', error.message);
    }
    return null;
  }
}

export const subjectService = new SubjectService();