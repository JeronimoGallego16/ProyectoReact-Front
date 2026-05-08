import { User, TeacherProfile } from './User';

/**
 * Interface Docente - Extiende User
 * Teacher SIEMPRE tiene profile de tipo TeacherProfile (con phone y specialty)
 */
export interface Teacher extends User {
  profile: TeacherProfile; // Obligatorio y específico para Teacher
}
