import { z } from 'zod';
import { CreateStorePayload } from './store.schema';

export const AddItemPayload = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: 'Name is required' }),
  description: z.string().optional(),
  price: z
    .number({ invalid_type_error: 'Price must be a number' })
    .min(0.01, { message: 'Price is required' }),
  available: z.boolean().optional(),
  category: z.array(z.string()).min(1, { message: 'select at least 1 category' }),
  imgUrl: z.string().optional(),
  restaurantId: z.string(),
  restaurant: CreateStorePayload.optional(),
});

export type ItemPayload = z.infer<typeof AddItemPayload>;
