import apiService from './api';
import { Career, CareerCreateInput, CareerUpdateInput } from '../models/Career';
import { registrationService } from './RegistrationService';

const API_URL = '/academic/careers';

class CareerService {
  // Método para obtener todas las carreras.
  async getCareers(): Promise<Career[]> {
    try {
      const res = await apiService.get<Career[]>(API_URL);
      if (!res || !res.success) return [];
      const data = res.data ?? [];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return this._handleError(error) || [];
    }
  }

  async getActiveCareers(): Promise<Career[]> {
    try {
      const careers = await this.getCareers();
      return careers.filter(career => career.is_active);
    } catch (error) {
      return this._handleError(error) || [];
    }
  }

  // Método para obtener una carrera por ID.
  async getCareerById(id: string): Promise<Career | null> {
    try {
      const res = await apiService.get<Career>(`${API_URL}/${id}`);
      if (!res || !res.success) return this._handleError(new Error(res?.error)) || null;
      return (res.data as Career) || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para crear una nueva carrera.
  // Validación: código único en el sistema.
  async createCareer(payload: CareerCreateInput): Promise<Career | null> {
    try {
      if (!payload.code || !payload.name) {
        throw new Error('Code and name are required');
      }

      // Validar código único client-side antes de enviar
      const existing = await this.getCareers();
      if (existing.some(c => c.code === payload.code)) {
        throw new Error(`Career code "${payload.code}" already exists`);
      }

      const res = await apiService.post<Career>(API_URL, payload);
      if (!res || !res.success) return this._handleError(new Error(res?.error)) || null;
      return (res.data as Career) || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para actualizar una carrera existente.
  async updateCareer(id: string, payload: CareerUpdateInput): Promise<Career | null> {
    try {
      const res = await apiService.put<Career>(`${API_URL}/${id}`, payload);
      if (!res || !res.success) return this._handleError(new Error(res?.error)) || null;
      return (res.data as Career) || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para archivar una carrera (marcar como inactiva).
  // Una carrera archivada no puede tener estudiantes matriculados activos.
  async archiveCareer(id: string): Promise<Career | null> {
    try {
      const activeRegistrations = await registrationService.getRegistrationsByCareer(id);
      if (activeRegistrations.some(registration => registration.is_active)) {
        throw new Error('Cannot archive a career with active registrations');
      }

      return await this.updateCareer(id, { is_active: false });
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Helpers
  private _handleError(error: any): any {
    if (error.response?.data?.error) {
      console.error('Career error:', error.response.data.error);
    } else {
      console.error('Career error:', error.message);
    }
    return null;
  }
}

export const careerService = new CareerService();
