import type { UserRole } from './user-role.types';

export interface User {
  id: string;
  email: string;
  phone: string;
  name?: string;
  role: UserRole;
}
