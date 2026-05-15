import { Group } from './Group';

export interface TeacherGroupPayload {
  teacherId: string;
  subjectId: string;
  semesterId: string;
  name: string;
  groupCode: string;
  capacity: number;
}

export interface TeacherGroupResponse {
  success: boolean;
  group?: Group;
  error?: string;
  details?: {
    teacherName?: string;
    subjectName?: string;
    groupId?: string;
  };
}

export interface AssignTeacherPayload {
  semesterId: string;
  groupId: string;
  teacherId: string;
}

export interface AssignTeacherResponse {
  success: boolean;
  group?: Group;
  error?: string;
  message?: string;
}
