import apiService, { ApiResponse } from './api';
import { Teacher } from '../models/Teacher';
import { CreateTeacherPayload, UpdateTeacherPayload } from '../models/TeacherPayload';

/**
 * Servicio específico para Docentes
 */
class TeacherService {
  private endpoint = '/users';
  private searchEndpoint = '/users/search';

  /**
   * Listar todos los docentes
   */
  async getAllTeachers(): Promise<ApiResponse<Teacher[]>> {
    return apiService.get<Teacher[]>(this.searchEndpoint, { role: 'TEACHER' });
  }

  /**
   * Obtener un docente por ID
   */
  async getTeacherById(teacherId: string): Promise<ApiResponse<Teacher>> {
    return apiService.get<Teacher>(`${this.endpoint}/${teacherId}`);
  }

  /**
   * Crear un nuevo docente
   */
  async createTeacher(payload: CreateTeacherPayload): Promise<ApiResponse<Teacher>> {
    return apiService.post<Teacher>(`${this.endpoint}/public/register-teacher`, {
      ...payload,
      role: 'TEACHER',
    });
  }

  /**
   * Actualizar datos del docente
   */
  async updateTeacher(teacherId: string, payload: UpdateTeacherPayload): Promise<ApiResponse<Teacher>> {
    return apiService.put<Teacher>(`${this.endpoint}/${teacherId}`, payload);
  }

  /**
   * Desactivar docente
   */
  async deactivateTeacher(teacherId: string): Promise<ApiResponse<Teacher>> {
    return apiService.patch<Teacher>(
      `${this.endpoint}/${teacherId}/deactivate`,
      {}
    );
  }

  /**
   * Eliminar docente
   */
  async deleteTeacher(teacherId: string): Promise<ApiResponse<any>> {
    return apiService.delete<any>(`${this.endpoint}/${teacherId}`);
  }
}

export default new TeacherService();
