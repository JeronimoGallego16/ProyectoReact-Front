import apiClient from '../interceptor/apiClient';
import { Career, CareerCreateInput, CareerUpdateInput } from '../models/Career';

const API_URL = '/academic/careers';

class CareerService {
  // Método para obtener todas las carreras.
  async getCareers(): Promise<Career[]> {
    try {
      const response = await apiClient.get(API_URL);
      const data = this._extractData(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return this._handleError(error) || [];
    }
  }

  // Método para obtener una carrera por ID.
  async getCareerById(id: string): Promise<Career | null> {
    try {
      const response = await apiClient.get(`${API_URL}/${id}`);
      return this._extractData(response) as Career || null;
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

      const response = await apiClient.post(API_URL, payload);
      return this._extractData(response) as Career || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para actualizar una carrera existente.
  async updateCareer(id: string, payload: CareerUpdateInput): Promise<Career | null> {
    try {
      const response = await apiClient.put(`${API_URL}/${id}`, payload);
      return this._extractData(response) as Career || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para archivar una carrera (marcar como inactiva).
  // Una carrera archivada no puede tener estudiantes matriculados activos.
  async archiveCareer(id: string): Promise<Career | null> {
    try {
      return await this.updateCareer(id, { is_active: false });
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
      console.error('Career error:', error.response.data.error);
    } else {
      console.error('Career error:', error.message);
    }
    return null;
  }
}

export const careerService = new CareerService();
