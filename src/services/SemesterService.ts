import apiService from './api';
import { Semester, SemesterCreateInput, SemesterUpdateInput } from '../models/Semester';

const API_URL = '/academic/semesters';

class SemesterService {
  // Método para obtener todos los semestres.
  async getSemesters(): Promise<Semester[]> {
    try {
      const res = await apiService.get<Semester[]>(API_URL);
      if (!res || !res.success) return [];
      const data = res.data ?? [];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return this._handleError(error) || [];
    }
  }

  async getActiveSemesters(): Promise<Semester[]> {
    try {
      const semesters = await this.getSemesters();
      return semesters.filter(semester => semester.is_active);
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
      const res = await apiService.get<Semester>(`${API_URL}/${id}`);
      if (!res || !res.success) return this._handleError(new Error(res?.error)) || null;
      return (res.data as Semester) || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para crear un nuevo semestre.
  // Validación: start_date < end_date.
  // Si is_active=true, desactiva otros semestres.
  async createSemester(payload: SemesterCreateInput): Promise<Semester | null> {
    try {
      if (!payload.name || !payload.code) {
        throw new Error('El nombre y el código son obligatorios.');
      }

      // Validar fechas
      const startDate = new Date(payload.start_date);
      const endDate = new Date(payload.end_date);
      if (startDate >= endDate) {
        throw new Error('La fecha de inicio debe ser anterior a la fecha de fin.');
      }

      const res = await apiService.post<Semester>(API_URL, payload);
      if (!res || !res.success) {
        throw new Error(res?.error || 'No se pudo crear el semestre.');
      }
      const createdSemester = res.data as Semester | null;
      if (!createdSemester) {
        throw new Error('No se recibió el semestre creado.');
      }

      if (payload.is_active) {
        return await this.activateSemester(createdSemester.id);
      }

      return createdSemester;
    } catch (error) {
      this._throwError(error);
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
          throw new Error('La fecha de inicio debe ser anterior a la fecha de fin.');
        }
      }

      const res = await apiService.put<Semester>(`${API_URL}/${id}`, payload);
      if (!res || !res.success) {
        throw new Error(res?.error || 'No se pudo actualizar el semestre.');
      }
      return (res.data as Semester) || null;
    } catch (error) {
      this._throwError(error);
    }
  }

  // Método para activar un semestre (desactiva automáticamente otros).
  // Solo puede haber un semestre activo a la vez.
  async activateSemester(id: string): Promise<Semester | null> {
    try {
      const semesters = await this.getSemesters();
      await Promise.all(
        semesters
          .filter(semester => semester.id !== id && semester.is_active)
          .map(semester => this.updateSemester(semester.id, { is_active: false }))
      );

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
  private _getErrorMessage(error: any): string {
    if (error.response?.data?.error) return error.response.data.error;
    if (error.response?.data?.message) return error.response.data.message;
    if (error.message) return error.message;
    return 'Error desconocido';
  }

  private _handleError(error: any): any {
    const message = this._getErrorMessage(error);
    console.error('Semester error:', message);
    return null;
  }

  private _throwError(error: any): never {
    const message = this._getErrorMessage(error);
    console.error('Semester error:', message);
    throw new Error(message);
  }
}

export const semesterService = new SemesterService();
