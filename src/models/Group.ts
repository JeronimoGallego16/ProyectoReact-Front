export interface Group {
  id: string;
  teacher_id: string;
  subject_id: string;
  semester_id: string;
  name: string;
  group_code: string;
  capacity: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GroupWithDetails extends Group {
  code?: string;
}

export type GroupCreateInput = Omit<Group, 'id' | 'created_at' | 'updated_at'>;
export type GroupUpdateInput = Partial<GroupCreateInput>;

export interface FilterOptionType {
  id: string;
  label: string;
  placeholder?: string;
}