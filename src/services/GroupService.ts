import apiClient from '../interceptor/apiClient';
import { Group, GroupCreateInput, GroupUpdateInput } from '../models/Group';

const API_URL = '/academic/groups';

class GroupService {
  // Método para obtener todos los grupos.
  async getGroups(): Promise<Group[]> {
    try {
      const response = await apiClient.get(API_URL);
      const data = this._extractData(response);
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
      const response = await apiClient.get(`${API_URL}/${id}`);
      return this._extractData(response) as Group || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para crear un nuevo grupo.
  // El teacher_id puede estar vacío y asignarse después mediante TeacherAGroupService
  async createGroup(payload: GroupCreateInput): Promise<Group | null> {
    try {
      // Validaciones básicas - teacher_id es opcional
      if (!payload.subject_id || !payload.semester_id || !payload.group_code) {
        throw new Error('Subject, semester, and group code are required');
      }

      // Validar group_code único
      const allGroups = await this.getGroups();
      if (allGroups.some(g => g.group_code === payload.group_code)) {
        throw new Error(`Group code "${payload.group_code}" already exists`);
      }

      const response = await apiClient.post(API_URL, payload);
      return this._extractData(response) as Group || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para desactivar un grupo
  async deactivateGroup(groupId: string): Promise<Group | null> {
    try {
      const response = await apiClient.patch(`${API_URL}/${groupId}`, { is_active: false });
      return this._extractData(response) as Group || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Método para actualizar un grupo.
  async updateGroup(id: string, payload: GroupUpdateInput): Promise<Group | null> {
    try {
      const response = await apiClient.put(`${API_URL}/${id}`, payload);
      return this._extractData(response) as Group || null;
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

      const response = await apiClient.patch(`${API_URL}/${groupId}/assign-teacher/${teacherId}`);
      return this._extractData(response) as Group || null;
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

  // Método para desactivar un grupo.
  async deactivateGroup(groupId: string): Promise<Group | null> {
    try {
      const response = await apiClient.patch(`${API_URL}/${groupId}`, { is_active: false });
      return this._extractData(response) as Group || null;
    } catch (error) {
      return this._handleError(error);
    }
  }

  // Helpers
  private _extractData(response: any): any {
    if (!response) return null;
    if (response.data && response.data.data !== undefined) return response.data.data;
    if (response.data !== undefined) return response.data;
    return null;
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
