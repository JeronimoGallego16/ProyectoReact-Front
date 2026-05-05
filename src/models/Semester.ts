export interface Semester {
  id: string;
  name: string;
  code: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type SemesterCreateInput = Omit<Semester, 'id' | 'created_at' | 'updated_at'>;
export type SemesterUpdateInput = Partial<SemesterCreateInput>;