import api from '@/api/axios';
import { ORDER_ITEM_ENPOINTS } from '@/api/endpoints';
import type { CreateOrderItemPayload } from '@/schemas/order-item.schema';

export const createOrderItem = async (data: CreateOrderItemPayload) => {
  try {
    const res = await api.post(ORDER_ITEM_ENPOINTS.CREATE_ORDER_ITEM, data);
    return res;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Unable to create a new order-item.';
    throw new Error(message);
  }
};
