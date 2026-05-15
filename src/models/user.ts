/**
 * Roles disponibles en el sistema.
 */
export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

/**
 * Profile base del usuario - Campos comunes a Student y Teacher
 */
export interface BaseUserProfile {
  id: string;
  first_name: string;
  last_name: string;
  identification: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Profile de Estudiante - Solo datos básicos
 * 
 * JSON del backend:
 * {
 *   "id": "...",
 *   "first_name": "John",
 *   "last_name": "Smith",
 *   "identification": "1001002",
 *   "user_id": "...",
 *   "created_at": "...",
 *   "updated_at": "..."
 * }
 */
export interface StudentProfile extends BaseUserProfile {
  // Student SOLO tiene: id, first_name, last_name, identification, user_id, created_at, updated_at
  // NO tiene phone ni specialty
}

/**
 * Profile de Docente - Datos básicos + campos específicos
 * 
 * JSON del backend:
 * {
 *   "id": "...",
 *   "first_name": "Alice",
 *   "last_name": "Brown",
 *   "identification": "90001",
 *   "phone": null,
 *   "specialty": null,
 *   "user_id": "...",
 *   "created_at": "...",
 *   "updated_at": "..."
 * }
 */
export interface TeacherProfile extends BaseUserProfile {
  phone: string | null;      // SIEMPRE presente (puede ser null)
  specialty: string | null;  // SIEMPRE presente (puede ser null)
}

/**
 * Interface genérica del perfil (para mantener compatibilidad)
 */
export type UserProfile = StudentProfile | TeacherProfile;

/**
 * Interface base de Usuario
 */
export interface User {
  id: string;
  email: string;
  code: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profile?: UserProfile;
  career?: {
    name?: string;
  };
}

/**
 * Datos de Usuario para formularios
 */
export interface UserData {
  id: string;
  email: string;
  code: string;
  profile?: {
    first_name?: string;
    last_name?: string;
  };
  role?: string;
}

/**
 * Usuario transformado para tabla
 */
export interface TableUser extends Record<string, any> {
  id: string;
  Código: string;
  Nombre: string;
  Email: string;
  Rol: string;
  Carrera: string;
  Estado: string;
  'Fecha creación': string;
}

/**
 * Credenciales para login
 */
export interface LoginCredentials {
  email: string;
  password: string;
}