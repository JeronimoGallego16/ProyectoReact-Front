import apiService from './api';
import { Group, GroupCreateInput } from '../models/Group';
import { AssignTeacherPayload, AssignTeacherResponse } from '../models/TeacherGroup';
import { groupService } from './GroupService';

class TeacherAGroupService {
  /**
   * Asigna un docente a un grupo con todas las validaciones
   * 
   * Validaciones:
   * 1. El grupo existe
   * 2. El docente existe y está activo (is_active = true)
   * 3. El grupo tiene asignatura_id definido
   * 4. El semestre seleccionado existe y está activo (is_active = true)
   * 5. El docente no tiene otro grupo con la misma asignatura en el mismo semestre
   * 6. El docente actual es diferente al nuevo docente
   */
  async assignTeacherToGroup(
    payload: AssignTeacherPayload
  ): Promise<AssignTeacherResponse> {
    try {
      const { semesterId, groupId, teacherId } = payload;

      // Validación 1: Verificar que el grupo existe
      const group = await groupService.getGroupById(groupId);
      if (!group) {
        return {
          success: false,
          error: 'Grupo no encontrado',
        };
      }

      // Validación 3: Verificar que el grupo tiene asignatura definida
      if (!group.subject_id) {
        return {
          success: false,
          error: 'El grupo no tiene una asignatura definida. Completa la información del grupo primero.',
        };
      }

      // Validación 2: Verificar que el docente existe y está activo
      // teacherId es en realidad user_id (del usuario con role TEACHER)
      const teacherResponse = await apiService.get<any>(
        `/users/${teacherId}`
      );
      if (!teacherResponse?.data) {
        return {
          success: false,
          error: 'Docente no encontrado',
        };
      }
      const teacher = teacherResponse.data;

      // Validación 2b: Verificar que el docente está activo
      if (!teacher.is_active) {
        return {
          success: false,
          error: 'No se puede asignar un docente desactivado. El docente debe estar activo para poder asignarlo a un grupo.',
        };
      }

      // Validación 4b: Verificar que el semestre está activo
      const semesterResponse = await apiService.get<any>(
        `/academic/semesters/${semesterId}`
      );
      const semester = semesterResponse?.data;
      if (!semester || !semester.is_active) {
        return {
          success: false,
          error: 'No se puede asignar un docente a un grupo en un semestre inactivo. Por favor selecciona un semestre activo.',
        };
      }

      // Validación 6: Verificar que el docente actual es diferente
      if (group.teacher_id === teacherId) {
        return {
          success: false,
          error: 'El docente seleccionado ya está asignado a este grupo',
        };
      }

      // Validación 5: Verificar que el docente no tenga conflicto (mismo asignatura en mismo semestre)
      // Se valida contra el semesterId proporcionado (puede ser diferente al actual)
      const teacherGroups = await groupService.getGroupsByTeacher(teacherId);
      const conflict = teacherGroups.find(
        g => g.subject_id === group.subject_id && 
            g.semester_id === semesterId && 
            g.id !== groupId
      );
      if (conflict) {
        return {
          success: false,
          error: `El docente ya tiene un grupo con esta asignatura en este semestre (${conflict.group_code})`,
        };
      }

      // Actualizar el grupo con el nuevo docente y semestre
      const updatedGroup = await groupService.updateGroup(groupId, {
        teacher_id: teacherId,
        semester_id: semesterId,
      });

      if (!updatedGroup) {
        return {
          success: false,
          error: 'Error al actualizar el grupo en el servidor',
        };
      }

      return {
        success: true,
        group: updatedGroup,
        message: `Docente ${teacher.profile?.first_name || teacher.email} asignado correctamente al grupo ${group.group_code}`,
      };
    } catch (error: any) {
      console.error('Error en assignTeacherToGroup:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido al asignar docente',
      };
    }
  }

  /**
   * Obtiene todos los grupos de un docente
   */
  async getTeacherGroups(teacherId: string): Promise<Group[]> {
    try {
      return await groupService.getGroupsByTeacher(teacherId);
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
      return await groupService.getGroupById(groupId);
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
      return await groupService.updateGroup(groupId, updates);
    } catch (error) {
      console.error('Error al actualizar grupo:', error);
      return null;
    }
  }

  /**
   * Desactiva un grupo
   */
  async deleteGroup(groupId: string): Promise<boolean> {
    try {
      await apiService.patch(`/groups/${groupId}`, { is_active: false });
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new TeacherAGroupService();
