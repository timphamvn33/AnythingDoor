import type { UserRole } from './user-role.types';

export interface User {
  id: string;
  email: string;
  phone: string;
  name?: string;
  role: UserRole;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zip: string | null;
  currentLocation: string | null;
}
