export interface Registration {
  id: string;
  career_id: string;
  student_id: string;
  admission_period: string;
  academic_status: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type RegistrationCreateInput = Omit<Registration, 'id' | 'created_at' | 'updated_at'>;
export type RegistrationUpdateInput = Partial<RegistrationCreateInput>;