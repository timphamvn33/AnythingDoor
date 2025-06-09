import { z } from 'zod';
import { OrderStatus } from '@db/generated/prisma/client';

export const CreateOrderPayload = z.object({
  addressId: z.string().optional(),
  paymentId: z.string().optional(),
  status: z.nativeEnum(OrderStatus),
  total: z.number().nonnegative(),
});

export type CreateOrderPayload = z.infer<typeof CreateOrderPayload>;
