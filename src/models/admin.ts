import { User } from './User';

/**
 * Interface Admin - Extiende User.
 * Admin NO tiene profile, solo la información base del User.
 */
export interface Admin extends User {
  // Admin hereda todos los atributos de User
  // No tiene propiedades adicionales
}
