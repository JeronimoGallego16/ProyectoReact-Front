import apiService from './api';
import { Career, CareerCreateInput, CareerUpdateInput } from '../models/Career';
import { studyPlanService } from './StudyPlanService';
import { groupService } from './GroupService';
import { studyPlanSubjectService } from './StudyPlanSubjectService';
import { semesterService } from './SemesterService';

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
        throw new Error('El código y el nombre son obligatorios.');
      }

      // Validar código único client-side antes de enviar
      const existing = await this.getCareers();
      if (existing.some(c => c.code === payload.code)) {
        throw new Error(`El código de carrera "${payload.code}" ya existe.`);
      }

      const res = await apiService.post<Career>(API_URL, payload);
      if (!res || !res.success) {
        throw new Error(res?.error || 'No se pudo crear la carrera.');
      }
      return (res.data as Career) || null;
    } catch (error) {
      this._throwError(error);
    }
  }

  // Método para actualizar una carrera existente.
  async updateCareer(id: string, payload: CareerUpdateInput): Promise<Career | null> {
    try {
      const res = await apiService.put<Career>(`${API_URL}/${id}`, payload);
      if (!res || !res.success) {
        throw new Error(res?.error || 'No se pudo actualizar la carrera.');
      }
      return (res.data as Career) || null;
    } catch (error) {
      this._throwError(error);
    }
  }

  // Método para archivar una carrera (marcar como inactiva).
  // Una carrera archivada no puede tener planes de estudio publicados activos.
  async archiveCareer(id: string): Promise<Career | null> {
    try {
      // No permitir archivar si existen planes de estudio publicados
      const publishedPlans = await studyPlanService.getPublishedStudyPlansByCareer(id);
      if (publishedPlans.length > 0) {
        throw new Error('No se puede archivar una carrera que tiene planes de estudio publicados.');
      }

      // Verificar si existe un semestre activo que esté asociado a la carrera.
      // Como el backend modela semestres como globales, estimamos la asociación
      // buscando grupos en el semestre activo que pertenezcan a asignaturas
      // vinculadas a los planes de estudio de la carrera.
      const activeSemester = await semesterService.getActiveSemester();
      if (activeSemester) {
        const groups = await groupService.getGroupsBySemester(activeSemester.id);
        if (groups && groups.length > 0 && publishedPlans.length >= 0) {
          // Reunir todas las asignaturas vinculadas a los planes de la carrera
          const subjectIds = new Set<string>();
          const plans = await studyPlanService.getStudyPlansByCareer(id);
          for (const plan of plans) {
            const subjects = await studyPlanSubjectService.getSubjectsByStudyPlan(plan.id);
            for (const s of subjects) {
              subjectIds.add(s.id);
            }
          }

          // Si algún grupo del semestre activo tiene una asignatura de esos planes,
          // consideramos que el semestre está asociado a la carrera y bloqueamos el archivado.
          const conflict = groups.find(g => subjectIds.has(g.subject_id));
          if (conflict) {
            throw new Error('No se puede archivar la carrera porque existe un semestre activo asociado a ella.');
          }
        }
      }

      return await this.updateCareer(id, { is_active: false });
    } catch (error) {
      this._throwError(error);
    }
  }

  // Método para reactivar una carrera (marcar como activa).
  async reactivateCareer(id: string): Promise<Career | null> {
    try {
      return await this.updateCareer(id, { is_active: true });
    } catch (error) {
      this._throwError(error);
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
    console.error('Career error:', message);
    return null;
  }

  private _throwError(error: any): never {
    const message = this._getErrorMessage(error);
    console.error('Career error:', message);
    throw new Error(message);
  }
}

export const careerService = new CareerService();