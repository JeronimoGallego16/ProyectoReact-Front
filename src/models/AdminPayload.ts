export interface CreateAdminPayload {
  email: string;
  password: string;
  code: string;
}

export interface UpdateAdminPayload {
  email?: string;
}
