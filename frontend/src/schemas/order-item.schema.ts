import { z } from 'zod';

export const CreateOrderItemPayload = z.object({
  orderId: z.string(),
  menuItemId: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
});

export type CreateOrderItemPayload = z.infer<typeof CreateOrderItemPayload>;
