import { z } from 'zod';
export const updateUserDataSchema = z
  .object({
    name: z.string().min(1, { message: 'Name is required' }),

    email: z.string().email({ message: 'Invalid email format' }),

    phone: z
      .string()
      .min(10, { message: 'Phone number is too short' })
      .max(15, { message: 'Phone number is too long' }),
    address: z.string().max(255, { message: 'Address must be at most 255 characters' }),
    city: z.string().max(100, { message: 'City must be at most 100 characters' }),
    state: z.string().max(100, { message: 'State must be at most 100 characters' }),
    country: z.string().max(100, { message: 'Country must be at most 100 characters' }),
    zip: z.string().max(20, { message: 'ZIP/postal code must be at most 20 characters' }),
    currentLocation: z
      .string()
      .max(255, { message: 'Location must be at most 255 characters' }),

    // role: z.array(roleEnum, { required_error: 'At least one role is required' }),
  })
  .partial();

export type UpdateUserData = z.infer<typeof updateUserDataSchema>;
