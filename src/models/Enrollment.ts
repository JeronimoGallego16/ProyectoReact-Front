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