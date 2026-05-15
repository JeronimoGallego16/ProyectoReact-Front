import apiClient from '../interceptor/apiClient';
import { Semester, SemesterCreateInput, SemesterUpdateInput } from '../models/Semester';

const API_URL = '/academic/semesters';

class SemesterService {
  // Método para obtener todos los semestres.
  async getSemesters(): Promise<Semester[]> {
    try {
      const response = await apiClient.get(API_URL);
      const data = this._extractData(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return this._handleError(error) || [];
    }
  }

  // Método para obtener el semestre activo (si existe).
  async getActiveSemester(): Promise<Semester | null> {
    try {
      const semesters = await this.getSemesters();
      return semesters.find(s => s.is_active) || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para obtener un semestre por ID.
  async getSemesterById(id: string): Promise<Semester | null> {
    try {
      const response = await apiClient.get(`${API_URL}/${id}`);
      return this._extractData(response) as Semester || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para crear un nuevo semestre.
  // Validación: start_date < end_date.
  // Si is_active=true, desactiva otros semestres.
  async createSemester(payload: SemesterCreateInput): Promise<Semester | null> {
    try {
      // Validar fechas
      const startDate = new Date(payload.start_date);
      const endDate = new Date(payload.end_date);
      if (startDate >= endDate) {
        throw new Error('start_date must be before end_date');
      }

      const response = await apiClient.post(API_URL, payload);
      return this._extractData(response) as Semester || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para actualizar un semestre.
  async updateSemester(id: string, payload: SemesterUpdateInput): Promise<Semester | null> {
    try {
      // Si actualiza fechas, validar
      if (payload.start_date && payload.end_date) {
        const startDate = new Date(payload.start_date);
        const endDate = new Date(payload.end_date);
        if (startDate >= endDate) {
          throw new Error('start_date must be before end_date');
        }
      }

      const response = await apiClient.put(`${API_URL}/${id}`, payload);
      return this._extractData(response) as Semester || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para activar un semestre (desactiva automáticamente otros).
  // Solo puede haber un semestre activo a la vez.
  async activateSemester(id: string): Promise<Semester | null> {
    try {
      return await this.updateSemester(id, { is_active: true });
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para cerrar un semestre (marcar como inactivo).
  async closeSemester(id: string): Promise<Semester | null> {
    try {
      return await this.updateSemester(id, { is_active: false });
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
      console.error('Semester error:', error.response.data.error);
    } else {
      console.error('Semester error:', error.message);
    }
    return null;
  }
}

export const semesterService = new SemesterService();
