import apiService, { ApiResponse } from './api';
import { Student } from '../models/student';
import { CreateUserPayload, UpdateUserPayload } from './user.service';

/**
 * Servicio específico para Estudiantes
 */
class StudentService {
  private endpoint = '/api/users';

  /**
   * Listar todos los estudiantes
   */
  async getAllStudents(): Promise<ApiResponse<Student[]>> {
    return apiService.get<Student[]>(this.endpoint, { role: 'STUDENT' });
  }

  /**
   * Obtener un estudiante por ID
   */
  async getStudentById(studentId: string): Promise<ApiResponse<Student>> {
    return apiService.get<Student>(`${this.endpoint}/${studentId}`);
  }

  /**
   * Crear un nuevo estudiante
   */
  async createStudent(payload: Omit<CreateUserPayload, 'role'>): Promise<ApiResponse<Student>> {
    return apiService.post<Student>(this.endpoint, {
      ...payload,
      role: 'STUDENT',
    });
  }

  /**
   * Actualizar datos del estudiante
   */
  async updateStudent(studentId: string, payload: UpdateUserPayload): Promise<ApiResponse<Student>> {
    return apiService.put<Student>(`${this.endpoint}/${studentId}`, payload);
  }

  /**
   * Desactivar estudiante
   */
  async deactivateStudent(studentId: string): Promise<ApiResponse<Student>> {
    return apiService.patch<Student>(
      `${this.endpoint}/${studentId}/deactivate`,
      {}
    );
  }

  /**
   * Eliminar estudiante
   */
  async deleteStudent(studentId: string): Promise<ApiResponse<any>> {
    return apiService.delete<any>(`${this.endpoint}/${studentId}`);
  }

  /**
   * Registrar estudiante públicamente
   */
  async registerStudent(payload: CreateUserPayload): Promise<ApiResponse<Student>> {
    return apiService.post<Student>('/api/users/public/register-student', payload);
  }
}

export default new StudentService();
