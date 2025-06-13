import { z } from 'zod';

export const CreateOrderItemPayload = z.object({
  orderId: z.string(),
  menuItemId: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
});

export const UpdateOrderItemPayload = z.object({
  orderId: z.string().optional(),
  menuItemId: z.string().optional(),
  quantity: z.number().optional(),
  price: z.string().optional(),
});

export type CreateOrderItemPayload = z.infer<typeof CreateOrderItemPayload>;
export type UpdateOrderItemPayload = z.infer<typeof UpdateOrderItemPayload>;
