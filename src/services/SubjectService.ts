import apiClient from '../interceptor/apiClient';
import { Subject, SubjectCreateInput, SubjectUpdateInput } from '../models/Subject';

const API_URL = '/academic/subjects';

class SubjectService {
  // Método para obtener todas las asignaturas.
  async getSubjects(): Promise<Subject[]> {
    try {
      const response = await apiClient.get(API_URL);
      const data = this._extractData(response);
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

  // Método para obtener una asignatura por ID.
  async getSubjectById(id: string): Promise<Subject | null> {
    try {
      const response = await apiClient.get(`${API_URL}/${id}`);
      return this._extractData(response) as Subject || null;
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

      const response = await apiClient.post(API_URL, payload);
      return this._extractData(response) as Subject || null;
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

      const response = await apiClient.put(`${API_URL}/${id}`, payload);
      return this._extractData(response) as Subject || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para archivar una asignatura.
  // Una asignatura archivada no puede usarse en nuevos grupos ni planes.
  async archiveSubject(id: string): Promise<Subject | null> {
    try {
      return await this.updateSubject(id, { is_active: false });
    } catch (error) {
      return this._handleError(error);
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
      console.error('Subject error:', error.response.data.error);
    } else {
      console.error('Subject error:', error.message);
    }
    return null;
  }
}

export const subjectService = new SubjectService();
