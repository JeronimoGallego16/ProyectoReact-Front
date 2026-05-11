export type EnrollmentStatus = 'ACTIVE' | 'CANCELLED';

export interface Enrollment {
  id: string;
  student_id: string;
  group_id: string;
  enrollment_date?: string;
  status: EnrollmentStatus;
  created_at?: string;
  updated_at?: string;
}

export type EnrollmentCreateInput = Omit<Enrollment, 'id' | 'created_at' | 'updated_at'>;
export type EnrollmentUpdateInput = Partial<EnrollmentCreateInput>;