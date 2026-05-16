export interface CreateStudentPayload {
  email: string;
  password: string;
  code: string;
  first_name: string;
  last_name: string;
  identification: string;
}

export interface UpdateStudentPayload {
  email?: string;
  first_name?: string;
  last_name?: string;
  identification?: string;
}
