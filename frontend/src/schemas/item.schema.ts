import { z } from 'zod';

export const AddItemPayload = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  description: z.string().optional(),
  price: z
    .number({ invalid_type_error: 'Price must be a number' })
    .min(0.01, { message: 'Price is required' }),
  available: z.boolean().optional(),
  category: z.array(z.string()).optional(),
  imgUrl: z.string().optional(),
});

export type ItemPayload = z.infer<typeof AddItemPayload>;
