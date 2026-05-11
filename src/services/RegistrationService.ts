import apiClient from '../interceptor/apiClient';
import { Registration, RegistrationCreateInput, RegistrationUpdateInput } from '../models/Registration';

const API_URL = '/academic/registrations';

class RegistrationService {
  // Método para obtener todas las matrículas.
  async getRegistrations(): Promise<Registration[]> {
    try {
      const response = await apiClient.get(API_URL);
      const data = this._extractData(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return this._handleError(error) || [];
    }
  }

  // Método para obtener matrículas de un estudiante.
  async getRegistrationsByStudent(studentId: string): Promise<Registration[]> {
    try {
      const registrations = await this.getRegistrations();
      return registrations.filter(r => r.student_id === studentId);
    } catch (error) {
      return this._handleError(error) || [];
    }
  }

  // Método para obtener matrículas activas de un estudiante.
  async getActiveRegistrationsByStudent(studentId: string): Promise<Registration[]> {
    try {
      const registrations = await this.getRegistrationsByStudent(studentId);
      return registrations.filter(r => r.is_active);
    } catch (error) {
      return this._handleError(error) || [];
    }
  }

  // Método para obtener matrículas de una carrera.
  async getRegistrationsByCareer(careerId: string): Promise<Registration[]> {
    try {
      const registrations = await this.getRegistrations();
      return registrations.filter(r => r.career_id === careerId);
    } catch (error) {
      return this._handleError(error) || [];
    }
  }

  // Método para obtener una matrícula por ID.
  async getRegistrationById(id: string): Promise<Registration | null> {
    try {
      const response = await apiClient.get(`${API_URL}/${id}`);
      return this._extractData(response) as Registration || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para crear una nueva matrícula.
  // Validación: un estudiante no puede tener dos matrículas activas en la misma carrera.
  async createRegistration(payload: RegistrationCreateInput): Promise<Registration | null> {
    try {
      if (!payload.student_id || !payload.career_id) {
        throw new Error('Student ID and Career ID are required');
      }

      // Validar que no tenga matrícula activa en la misma carrera
      const existing = await this.getRegistrations();
      const duplicate = existing.find(
        r => r.student_id === payload.student_id &&
             r.career_id === payload.career_id &&
             r.is_active
      );
      if (duplicate) {
        throw new Error('Student already has an active registration in this career');
      }

      const response = await apiClient.post(API_URL, payload);
      return this._extractData(response) as Registration || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para actualizar una matrícula (cambiar estado académico o desactivarla).
  async updateRegistration(id: string, payload: RegistrationUpdateInput): Promise<Registration | null> {
    try {
      const response = await apiClient.put(`${API_URL}/${id}`, payload);
      return this._extractData(response) as Registration || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para cambiar el estado académico de una matrícula (ej: de activo a retirado).
  async updateAcademicStatus(registrationId: string, academicStatus: string): Promise<Registration | null> {
    try {
      return await this.updateRegistration(registrationId, { academic_status: academicStatus });
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para desactivar una matrícula (sin eliminar el registro).
  async deactivateRegistration(registrationId: string): Promise<Registration | null> {
    try {
      return await this.updateRegistration(registrationId, { is_active: false });
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para verificar si un estudiante tiene matrícula activa en una carrera.
  async hasActiveRegistration(studentId: string, careerId: string): Promise<boolean> {
    try {
      const registrations = await this.getRegistrations();
      return registrations.some(
        r => r.student_id === studentId &&
             r.career_id === careerId &&
             r.is_active
      );
    } catch (error) {
      return this._handleError(error) || false;
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
      console.error('Registration error:', error.response.data.error);
    } else {
      console.error('Registration error:', error.message);
    }
    return null;
  }
}

export const registrationService = new RegistrationService();
