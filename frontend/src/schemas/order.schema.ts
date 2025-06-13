import { z } from 'zod';
import { OrderStatus } from '@db/generated/prisma/client';

export const CreateOrderPayload = z.object({
  addressId: z.string().optional(),
  paymentId: z.string().optional(),
  status: z.nativeEnum(OrderStatus),
  total: z.number().nonnegative(),
});

export const UpdateOrderItemPayload = z.object({
  addressId: z.string().optional(),
  paymentId: z.string().optional(),
  status: z.nativeEnum(OrderStatus).optional(),
  total: z.number().optional(),
});

export type CreateOrderPayload = z.infer<typeof CreateOrderPayload>;
export type UpdateOrderItemPayload = z.infer<typeof UpdateOrderItemPayload>;
