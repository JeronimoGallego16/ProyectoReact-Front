import apiService, { ApiResponse } from './api';
import { Student } from '../models/student';
import { CreateStudentPayload, UpdateStudentPayload } from '../models/StudentPayload';

/**
 * Servicio específico para Estudiantes
 */
class StudentService {
  private usersEndpoint = '/users';
  private searchEndpoint = '/users/search';

  /**
   * Listar todos los estudiantes
   */
  async getAllStudents(): Promise<ApiResponse<Student[]>> {
    return apiService.get<Student[]>(this.searchEndpoint, { role: 'STUDENT' });
  }

  /**
   * Obtener un estudiante por ID
   */
  async getStudentById(studentId: string): Promise<ApiResponse<Student>> {
    return apiService.get<Student>(`${this.usersEndpoint}/${studentId}`);
  }

  /**
   * Obtener datos académicos del estudiante por academic student id
   * Endpoint: /academic/students/{id}
   */
  async getAcademicStudentById(academicStudentId: string): Promise<ApiResponse<any>> {
    return apiService.get<any>(`/academic/students/${academicStudentId}`);
  }

  /**
   * Crear un nuevo estudiante
   */
  async createStudent(payload: CreateStudentPayload): Promise<ApiResponse<Student>> {
    return apiService.post<Student>(`${this.usersEndpoint}/public/register-student`, {
      ...payload,
      role: 'STUDENT',
    });
  }

  /**
   * Actualizar datos del estudiante
   */
  async updateStudent(studentId: string, payload: UpdateStudentPayload): Promise<ApiResponse<Student>> {
    return apiService.put<Student>(`${this.usersEndpoint}/${studentId}`, payload);
  }

  /**
   * Desactivar/Activar estudiante
   */
  async deactivateStudent(studentId: string, isActive: boolean): Promise<ApiResponse<Student>> {
    return apiService.patch<Student>(
      `${this.usersEndpoint}/${studentId}/deactivate`,
      { is_active: isActive }
    );
  }

  /**
   * Eliminar estudiante
   */
  async deleteStudent(studentId: string): Promise<ApiResponse<any>> {
    return apiService.delete<any>(`${this.usersEndpoint}/${studentId}`);
  }
}

export default new StudentService();
