export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  credits: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type SubjectCreateInput = Omit<Subject, 'id' | 'created_at' | 'updated_at'>;
export type SubjectUpdateInput = Partial<SubjectCreateInput>;