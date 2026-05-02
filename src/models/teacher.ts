import { User } from './user';

/**
 * Clase Docente - Extiende de User.
 */
export class Teacher extends User {
  first_name: string;
  last_name: string;
  identification: string;
  user_id: string;
  phone: string | null;
  specialty: string | null;

  constructor(
    id: string,
    email: string,
    created_at: string,
    updated_at: string,
    is_active: boolean,
    first_name: string,
    last_name: string,
    identification: string,
    user_id: string,
    phone: string | null = null,
    specialty: string | null = null
  ) {
    super(id, email, created_at, updated_at, is_active, 'TEACHER');
    this.first_name = first_name;
    this.last_name = last_name;
    this.identification = identification;
    this.user_id = user_id;
    this.phone = phone;
    this.specialty = specialty;
  }
}
