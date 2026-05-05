export interface Group {
  id: string;
  teacher_id: string;
  subject_id: string;
  semester_id: string;
  name: string;
  group_code: string;
  capacity: number;
  created_at?: string;
  updated_at?: string;
}

export type GroupCreateInput = Omit<Group, 'id' | 'created_at' | 'updated_at'>;
export type GroupUpdateInput = Partial<GroupCreateInput>;