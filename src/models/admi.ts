import { User } from './user';

/**
 * Clase Administrador - Extiende de User.
 */
export class Admin extends User {
  code: string;
  password_hash: string;
  profile: any;

  constructor(
    id: string,
    email: string,
    created_at: string,
    updated_at: string,
    is_active: boolean,
    code: string,
    password_hash: string,
    profile: any = null
  ) {
    super(id, email, created_at, updated_at, is_active, 'ADMIN');
    this.code = code;
    this.password_hash = password_hash;
    this.profile = profile;
  }
}
