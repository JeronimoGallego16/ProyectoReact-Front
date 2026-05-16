import { Registration } from './Registration';

export interface StudentRegistrationPayload {
  studentId: string;
  careerId: string;
  admissionPeriod?: string;
  academicStatus?: string;
}

export interface StudentRegistrationResponse {
  success: boolean;
  registration?: Registration;
  error?: string;
  details?: {
    studentName?: string;
    careerName?: string;
    registrationId?: string;
  };
}
