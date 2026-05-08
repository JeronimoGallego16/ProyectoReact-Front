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
