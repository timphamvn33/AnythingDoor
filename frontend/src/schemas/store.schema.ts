import { z } from 'zod';

export const CreateStorePayload = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  category: z.array(z.string().min(1, 'Select at least one category')),
  openHrs: z.string().min(1, 'Opening hour is required'),
  closeHrs: z.string().min(1, 'Closing hour is required'),
});

export type StorePayload = z.infer<typeof CreateStorePayload>;
