import type { PaymentStatus } from '@db/generated/prisma/client';
import type { ItemProps } from './item.types';

export interface OrderItem {
  id: string;
  menuItemId: string;
  orderId: string;
  price: number;
  quantity: number;
  menuItem: ItemProps;
}

export interface Order {
  id: string;
  userId: string;
  addressId: string | null;
  paymentId: string | null;
  status: PaymentStatus;
  total: number;
  orderItems: OrderItem[];
  createdAt: string;
  updatedAt: string;
}
