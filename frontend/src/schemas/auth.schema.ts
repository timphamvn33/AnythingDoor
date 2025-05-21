import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
  password: z.string().min(6, { message: 'Password must be at least 6 chracters' }),
});

export const roleEnum = z.enum(['buyer', 'admin', 'driver', 'restaurant_owner']);

export const signupSchema = loginSchema.extend({
  name: z.string().min(1, { message: 'Name is required' }),
  phone: z
    .string()
    .min(10, { message: 'Phone number is too short' })
    .max(15, { message: 'Phone number is too long' }),
  role: z.array(roleEnum, { required_error: 'At least one role is required' }),
});

export type LogininPayload = z.infer<typeof loginSchema>;
export type SignupPayload = z.infer<typeof signupSchema>;
