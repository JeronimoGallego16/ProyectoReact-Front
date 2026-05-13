import { registrationService } from './RegistrationService';
import apiService from './api';
import { careerService } from './CareerService';
import { Registration, RegistrationCreateInput } from '../models/Registration';
import { StudentRegistrationPayload, StudentRegistrationResponse } from '../models/StudentRegistration';

class StudentRegistrationService {
  private usersEndpoint = '/users';
  private academicEndpoint = '/academic';

  /**
   * Matricula un estudiante existente a una carrera existente
   * Validaciones:
   * 1. El estudiante existe
   * 2. La carrera existe
   * 3. El estudiante no tiene matrícula activa en esa carrera
   */
  async registerStudentToCareer(
    payload: StudentRegistrationPayload
  ): Promise<StudentRegistrationResponse> {
    try {
      const {
        studentId,
        careerId,
        admissionPeriod = new Date().toISOString().split('T')[0],
        academicStatus = 'ACTIVE',
      } = payload;

      // Validación 1: Verificar que el estudiante existe
      // Usar el endpoint /users/{id} que obtiene el usuario estudiante
      const studentResponse = await apiService.get<any>(`${this.usersEndpoint}/${studentId}`);
      if (!studentResponse?.data) {
        return {
          success: false,
          error: 'Estudiante no encontrado',
        };
      }
      const student = studentResponse.data;
      
      // Usar el ID del perfil académico del estudiante (student profile ID)
      const academicStudentId = student.profile?.id;
      if (!academicStudentId) {
        return {
          success: false,
          error: 'Perfil académico del estudiante no encontrado',
        };
      }

      // Validación 2: Verificar que la carrera existe
      const career = await careerService.getCareerById(careerId);
      if (!career) {
        return {
          success: false,
          error: 'Carrera no encontrada',
        };
      }

      // Validación 3: Verificar que no tenga matrícula activa en esa carrera
      const hasActive = await registrationService.hasActiveRegistration(
        academicStudentId,
        careerId
      );
      if (hasActive) {
        return {
          success: false,
          error: 'El estudiante ya tiene una matrícula activa en esta carrera',
        };
      }

      // Crear la matrícula
      const registrationPayload: RegistrationCreateInput = {
        student_id: academicStudentId,
        career_id: careerId,
        admission_period: admissionPeriod,
        academic_status: academicStatus,
        is_active: true,
      };

      let registration;
      try {
        registration = await registrationService.createRegistration(
          registrationPayload
        );
      } catch (registrationError: any) {
        return {
          success: false,
          error: registrationError.message || 'Error al crear la matrícula en el backend',
        };
      }

      if (!registration) {
        return {
          success: false,
          error: 'Error al crear la matrícula en el backend',
        };
      }

      return {
        success: true,
        registration,
        details: {
          studentName: `${student.first_name} ${student.last_name}`,
          careerName: career.name,
          registrationId: registration.id,
        },
      };
    } catch (error: any) {
      console.error('Error en registerStudentToCareer:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido',
      };
    }
  }

  /**
   * Obtiene todas las matrículas de un estudiante
   */
  async getStudentRegistrations(studentId: string): Promise<Registration[]> {
    try {
      return await registrationService.getRegistrationsByStudent(studentId);
    } catch (error) {
      console.error('Error getting student registrations:', error);
      return [];
    }
  }

  /**
   * Obtiene las matrículas activas de un estudiante
   */
  async getActiveStudentRegistrations(studentId: string): Promise<Registration[]> {
    try {
      return await registrationService.getActiveRegistrationsByStudent(
        studentId
      );
    } catch (error) {
      console.error('Error getting active student registrations:', error);
      return [];
    }
  }

  /**
   * Desactiva una matrícula (cancela la inscripción)
   */
  async cancelRegistration(registrationId: string): Promise<boolean> {
    try {
      const result = await registrationService.deactivateRegistration(
        registrationId
      );
      return !!result;
    } catch (error) {
      console.error('Error canceling registration:', error);
      return false;
    }
  }

  /**
   * Actualiza el estado académico de una matrícula
   */
  async updateAcademicStatus(
    registrationId: string,
    status: string
  ): Promise<boolean> {
    try {
      const result = await registrationService.updateAcademicStatus(
        registrationId,
        status
      );
      return !!result;
    } catch (error) {
      console.error('Error updating academic status:', error);
      return false;
    }
  }
}

export default new StudentRegistrationService();
