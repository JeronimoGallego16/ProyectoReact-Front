import apiService from './api';
import { Group, GroupCreateInput, GroupUpdateInput } from '../models/Group';

const API_URL = '/academic/groups';

class GroupService {
  // Método para obtener todos los grupos.
  async getGroups(): Promise<Group[]> {
    try {
      const res = await apiService.get<Group[]>(API_URL);
      if (!res || !res.success) return [];
      const data = res.data ?? [];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return this._handleError(error) || [];
    }
  }

  // Método para obtener grupos de un semestre específico.
  async getGroupsBySemester(semesterId: string): Promise<Group[]> {
    try {
      const groups = await this.getGroups();
      return groups.filter(g => g.semester_id === semesterId);
    } catch (error) {
      return this._handleError(error) || [];
    }
  }

  // Método para obtener grupos de una asignatura.
  async getGroupsBySubject(subjectId: string): Promise<Group[]> {
    try {
      const groups = await this.getGroups();
      return groups.filter(g => g.subject_id === subjectId);
    } catch (error) {
      return this._handleError(error) || [];
    }
  }

  // Método para obtener grupos de un docente.
  async getGroupsByTeacher(teacherId: string): Promise<Group[]> {
    try {
      const groups = await this.getGroups();
      return groups.filter(g => g.teacher_id === teacherId);
    } catch (error) {
      return this._handleError(error) || [];
    }
  }

  // Método para obtener un grupo por ID.
  async getGroupById(id: string): Promise<Group | null> {
    try {
      const res = await apiService.get<Group>(`${API_URL}/${id}`);
      if (!res || !res.success) return this._handleError(new Error(res?.error)) || null;
      return (res.data as Group) || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para crear un nuevo grupo.
  // Requisitos: teacher_id, subject_id, semester_id, group_code único.
  // Validación: un docente no puede repetir asignatura en el mismo semestre.
  async createGroup(payload: GroupCreateInput): Promise<Group | null> {
    try {
      if (!payload.teacher_id || !payload.subject_id || !payload.semester_id || !payload.group_code) {
        throw new Error('Teacher, subject, semester, and group code are required');
      }

      // Validar que el docente no tenga ya un grupo con la misma asignatura en este semestre
      const teacherGroups = await this.getGroupsByTeacher(payload.teacher_id);
      const conflict = teacherGroups.find(
        g => g.subject_id === payload.subject_id && g.semester_id === payload.semester_id
      );
      if (conflict) {
        throw new Error(
          `Teacher already has a group for this subject in this semester (Group: ${conflict.group_code})`
        );
      }

      // Validar group_code único
      const allGroups = await this.getGroups();
      if (allGroups.some(g => g.group_code === payload.group_code)) {
        throw new Error(`Group code "${payload.group_code}" already exists`);
      }

      const res = await apiService.post<Group>(API_URL, payload);
      if (!res || !res.success) return this._handleError(new Error(res?.error)) || null;
      return (res.data as Group) || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para actualizar un grupo.
  async updateGroup(id: string, payload: GroupUpdateInput): Promise<Group | null> {
    try {
      const res = await apiService.put<Group>(`${API_URL}/${id}`, payload);
      if (!res || !res.success) return this._handleError(new Error(res?.error)) || null;
      return (res.data as Group) || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para asignar (o reasignar) un docente a un grupo.
  // Validación: el docente no puede tener otro grupo con la misma asignatura en el semestre.
  async assignTeacher(groupId: string, teacherId: string): Promise<Group | null> {
    try {
      const group = await this.getGroupById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      // Validar que el nuevo docente no tenga conflicto
      const teacherGroups = await this.getGroupsByTeacher(teacherId);
      const conflict = teacherGroups.find(
        g => g.subject_id === group.subject_id && 
            g.semester_id === group.semester_id && 
            g.id !== groupId
      );
      if (conflict) {
        throw new Error(
          `Teacher already has a group for this subject in this semester`
        );
      }

      const res = await apiService.patch<Group>(`${API_URL}/${groupId}/assign-teacher/${teacherId}`, {});
      if (!res || !res.success) return this._handleError(new Error(res?.error)) || null;
      return (res.data as Group) || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para obtener cupo disponible en un grupo.
  // Requiere lógica adicional para contar inscripciones activas desde EnrollmentService.
  async getAvailableCapacity(groupId: string, currentEnrollments: number): Promise<number> {
    try {
      const group = await this.getGroupById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }
      return Math.max(0, group.capacity - currentEnrollments);
    } catch (error) {
      return this._handleError(error) || 0;
    }
  }

  private _handleError(error: any): any {
    if (error.response?.data?.error) {
      console.error('Group error:', error.response.data.error);
    } else {
      console.error('Group error:', error.message);
    }
    return null;
  }
}

export const groupService = new GroupService();
