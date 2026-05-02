import { User } from './user';

/**
 * Clase Estudiante - Extiende de User.
 */
export class Student extends User {
  first_name: string;
  last_name: string;
  identification: string;
  user_id: string;

  constructor(
    id: string,
    email: string,
    created_at: string,
    updated_at: string,
    is_active: boolean,
    first_name: string,
    last_name: string,
    identification: string,
    user_id: string
  ) {
    super(id, email, created_at, updated_at, is_active, 'STUDENT');
    this.first_name = first_name;
    this.last_name = last_name;
    this.identification = identification;
    this.user_id = user_id;
  }
}
