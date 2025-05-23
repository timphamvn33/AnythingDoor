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

export const fullUserUpdateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

export type LogininPayload = z.infer<typeof loginSchema>;
export type SignupPayload = z.infer<typeof signupSchema>;
export type FullUserUpdate = z.infer<typeof fullUserUpdateSchema>;
