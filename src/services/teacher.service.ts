import apiService, { ApiResponse } from './api';
import { Teacher } from '../models/teacher';
import { CreateUserPayload, UpdateUserPayload } from './user.service';

/**
 * Servicio específico para Docentes
 */
class TeacherService {
  private endpoint = '/api/users';

  /**
   * Listar todos los docentes
   */
  async getAllTeachers(): Promise<ApiResponse<Teacher[]>> {
    return apiService.get<Teacher[]>(this.endpoint, { role: 'TEACHER' });
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
  async createTeacher(payload: Omit<CreateUserPayload, 'role'>): Promise<ApiResponse<Teacher>> {
    return apiService.post<Teacher>(this.endpoint, {
      ...payload,
      role: 'TEACHER',
    });
  }

  /**
   * Actualizar datos del docente
   */
  async updateTeacher(teacherId: string, payload: UpdateUserPayload): Promise<ApiResponse<Teacher>> {
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

  /**
   * Registrar docente públicamente
   */
  async registerTeacher(payload: CreateUserPayload): Promise<ApiResponse<Teacher>> {
    return apiService.post<Teacher>('/api/users/public/register-teacher', payload);
  }
}

export default new TeacherService();
