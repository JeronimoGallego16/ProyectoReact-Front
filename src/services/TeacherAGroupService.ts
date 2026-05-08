import apiService from './api';
import { careerService } from './CareerService';
import { Group, GroupCreateInput } from '../models/Group';

interface TeacherGroupPayload {
  teacherId: string;
  subjectId: string;
  semesterId: string;
  name: string;
  groupCode: string;
  capacity: number;
}

interface TeacherGroupResponse {
  success: boolean;
  group?: Group;
  error?: string;
  details?: {
    teacherName?: string;
    subjectName?: string;
    groupId?: string;
  };
}

class TeacherAGroupService {
  private academicEndpoint = '/academic';

  /**
   * Crea un grupo asignado a un docente existente
   * Validaciones:
   * 1. El docente existe
   * 2. La asignatura existe
   * 3. El semestre existe
   * 4. El código de grupo es único
   */
  async createGroupForTeacher(
    payload: TeacherGroupPayload
  ): Promise<TeacherGroupResponse> {
    try {
      const {
        teacherId,
        subjectId,
        semesterId,
        name,
        groupCode,
        capacity,
      } = payload;

      // Validación 1: Verificar que el docente existe
      const teacherResponse = await apiService.get<any>(
        `${this.academicEndpoint}/teachers/${teacherId}`
      );
      if (!teacherResponse?.data) {
        return {
          success: false,
          error: 'Docente no encontrado',
        };
      }
      const teacher = teacherResponse.data;

      // Validación 2: Verificar que la asignatura existe
      const subjectResponse = await apiService.get<any>(
        `${this.academicEndpoint}/subjects/${subjectId}`
      );
      if (!subjectResponse?.data) {
        return {
          success: false,
          error: 'Asignatura no encontrada',
        };
      }
      const subject = subjectResponse.data;

      // Validación 3: Verificar que el semestre existe
      const semesterResponse = await apiService.get<any>(
        `${this.academicEndpoint}/semesters/${semesterId}`
      );
      if (!semesterResponse?.data) {
        return {
          success: false,
          error: 'Semestre no encontrado',
        };
      }

      // Validación 4: Verificar que el código de grupo sea único
      const existingGroup = await apiService.get<any>(
        `${this.academicEndpoint}/groups`
      );
      if (Array.isArray(existingGroup?.data)) {
        const codeExists = existingGroup.data.some(
          (g: Group) => g.group_code === groupCode
        );
        if (codeExists) {
          return {
            success: false,
            error: 'El código de grupo ya existe',
          };
        }
      }

      // Crear el grupo
      const groupPayload: GroupCreateInput = {
        teacher_id: teacherId,
        subject_id: subjectId,
        semester_id: semesterId,
        name,
        group_code: groupCode,
        capacity,
      };

      const groupResponse = await apiService.post<Group>(
        `${this.academicEndpoint}/groups`,
        groupPayload
      );

      if (!groupResponse?.data) {
        return {
          success: false,
          error: 'Error al crear el grupo en el backend',
        };
      }

      return {
        success: true,
        group: groupResponse.data,
        details: {
          teacherName: `${teacher.first_name} ${teacher.last_name}`,
          subjectName: subject.name,
          groupId: groupResponse.data.id,
        },
      };
    } catch (error: any) {
      console.error('Error en createGroupForTeacher:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido',
      };
    }
  }

  /**
   * Obtiene todos los grupos de un docente
   */
  async getTeacherGroups(teacherId: string): Promise<Group[]> {
    try {
      const response = await apiService.get<Group[]>(
        `${this.academicEndpoint}/groups`
      );
      if (!Array.isArray(response?.data)) return [];
      return response.data.filter((g: Group) => g.teacher_id === teacherId);
    } catch (error) {
      console.error('Error al obtener grupos del docente:', error);
      return [];
    }
  }

  /**
   * Obtiene un grupo por ID
   */
  async getGroupById(groupId: string): Promise<Group | null> {
    try {
      const response = await apiService.get<Group>(
        `${this.academicEndpoint}/groups/${groupId}`
      );
      return response?.data || null;
    } catch (error) {
      console.error('Error al obtener grupo:', error);
      return null;
    }
  }

  /**
   * Actualiza un grupo
   */
  async updateGroup(
    groupId: string,
    updates: Partial<GroupCreateInput>
  ): Promise<Group | null> {
    try {
      const response = await apiService.put<Group>(
        `${this.academicEndpoint}/groups/${groupId}`,
        updates
      );
      return response?.data || null;
    } catch (error) {
      console.error('Error al actualizar grupo:', error);
      return null;
    }
  }

  /**
   * Elimina un grupo
   */
  async deleteGroup(groupId: string): Promise<boolean> {
    try {
      await apiService.delete(`${this.academicEndpoint}/groups/${groupId}`);
      return true;
    } catch (error) {
      console.error('Error al eliminar grupo:', error);
      return false;
    }
  }
}

export default new TeacherAGroupService();
