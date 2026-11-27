import { z } from 'zod';

export const CreateStorePayload = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: 'Name is required' }),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  category: z.array(z.string().min(1, { message: 'Select at least one category' })),
  openHrs: z.string().min(1, { message: 'Opening hour is required' }),
  closeHrs: z.string().min(1, { message: 'Closing hour is required' }),
  phoneNumber: z.string().optional(),
  address: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zip: z.string().min(1, 'ZIP is required'),
    country: z.string().min(1, 'Country is required'),
  }).optional(),
  hours: z.array(z.object({
    day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
    opensAt: z.string(),
    closesAt: z.string(),
  })).optional(),
});

export type StorePayload = z.infer<typeof CreateStorePayload>;
