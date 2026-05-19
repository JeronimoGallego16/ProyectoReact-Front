import apiService, { ApiResponse } from './api';
import { Teacher } from '../models/teacher';
import { CreateTeacherPayload, UpdateTeacherPayload } from '../models/TeacherPayload';

/**
 * Servicio específico para Docentes
 */
class TeacherService {
  private endpoint = '/users';
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
   * Desactivar/Activar docente
   */
  async deactivateTeacher(teacherId: string, isActive: boolean): Promise<ApiResponse<Teacher>> {
    return apiService.patch<Teacher>(
      `${this.endpoint}/${teacherId}/deactivate`,
      { is_active: isActive }
    );
  }

  /**
   * Eliminar docente
   */
  async deleteTeacher(teacherId: string): Promise<ApiResponse<any>> {
    return apiService.delete<any>(`${this.endpoint}/${teacherId}`);
  }

  /**
   * Método helper para encontrar el nombre de un docente en un array (búsqueda síncrona)
   */
  findTeacherName(teacherId: string | undefined, teachers: any[]): string {
    if (!teacherId) return 'Sin asignar';
    return teachers.find(t => t.id === teacherId)?.name || 'Sin asignar';
  }
}

export default new TeacherService();
