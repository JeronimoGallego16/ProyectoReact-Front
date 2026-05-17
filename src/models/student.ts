import { User, StudentProfile } from './user';

/**
 * Interface Estudiante - Extiende User
 * Student SIEMPRE tiene profile de tipo StudentProfile (sin phone ni specialty)
 */
export interface Student extends User {
  profile: StudentProfile; // Obligatorio y específico para Student
}
