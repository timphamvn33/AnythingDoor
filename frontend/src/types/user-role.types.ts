export const UserRoles = {
  BUYER: 'buyer',
  ADMIN: 'admin',
  DRIVER: 'driver',
  RESTAURANT_OWNER: 'restaurant_owner',
} as const;

export type UserRole = (typeof UserRoles)[keyof typeof UserRoles];
