import apiService, { ApiResponse } from './api';
import { Teacher } from '../models/teacher';
import { CreateTeacherPayload, UpdateTeacherPayload } from '../models/TeacherPayload';

/**
 * Servicio específico para Docentes
 */
class TeacherService {
  private usersEndpoint = '/users';
  private searchEndpoint = '/academic/teachers/search';

  /**
   * Listar todos los docentes
   */
  async getAllTeachers(): Promise<ApiResponse<Teacher[]>> {
    return apiService.get<Teacher[]>(this.searchEndpoint);
  }

  /**
   * Obtener un docente por ID
   */
  async getTeacherById(teacherId: string): Promise<ApiResponse<Teacher>> {
    return apiService.get<Teacher>(`${this.usersEndpoint}/${teacherId}`);
  }

  /**
   * Crear un nuevo docente
   */
  async createTeacher(payload: CreateTeacherPayload): Promise<ApiResponse<Teacher>> {
    return apiService.post<Teacher>(`${this.usersEndpoint}/public/register-teacher`, {
      ...payload,
      role: 'TEACHER',
    });
  }

  /**
   * Actualizar datos del docente
   */
  async updateTeacher(teacherId: string, payload: UpdateTeacherPayload): Promise<ApiResponse<Teacher>> {
    return apiService.put<Teacher>(`${this.usersEndpoint}/${teacherId}`, payload);
  }

  /**
   * Desactivar docente
   */
  async deactivateTeacher(teacherId: string): Promise<ApiResponse<Teacher>> {
    return apiService.patch<Teacher>(
      `${this.usersEndpoint}/${teacherId}/deactivate`,
      {}
    );
  }

  /**
   * Eliminar docente
   */
  async deleteTeacher(teacherId: string): Promise<ApiResponse<any>> {
    return apiService.delete<any>(`${this.usersEndpoint}/${teacherId}`);
  }
}

export default new TeacherService();
