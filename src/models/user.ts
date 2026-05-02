/**
 * Roles disponibles en el sistema.
 */
export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

/**
 * Clase base de Usuario.
 */
export class User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  role: UserRole;

  constructor(
    id: string,
    email: string,
    created_at: string,
    updated_at: string,
    is_active: boolean,
    role: UserRole
  ) {
    this.id = id;
    this.email = email;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.is_active = is_active;
    this.role = role;
  }
}