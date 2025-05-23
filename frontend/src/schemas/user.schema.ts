import { roleEnum } from '@/schemas/auth.schema';
import { z } from 'zod';
export const updateUserDataSchema = z
  .object({
    name: z.string().min(1, { message: 'Name is required' }),

    email: z.string().email({ message: 'Invalid email format' }),

    phone: z
      .string()
      .min(10, { message: 'Phone number is too short' })
      .max(15, { message: 'Phone number is too long' }),

    // role: z.array(roleEnum, { required_error: 'At least one role is required' }),
  })
  .partial();

export type UpdateUserData = z.infer<typeof updateUserDataSchema>;
