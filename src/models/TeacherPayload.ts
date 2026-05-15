export interface CreateTeacherPayload {
  email: string;
  password: string;
  code: string;
  first_name: string;
  last_name: string;
  identification: string;
  phone?: string;
  specialty?: string;
}

export interface UpdateTeacherPayload {
  email?: string;
  first_name?: string;
  last_name?: string;
  identification?: string;
  phone?: string;
  specialty?: string;
}
