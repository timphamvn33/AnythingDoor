import api from '@/api/axios';
import { ORDER_ITEM_ENPOINTS } from '@/api/endpoints';
import type { CreateOrderItemPayload, UpdateOrderItemPayload } from '@/schemas/order-item.schema';

export const createOrderItem = async (data: CreateOrderItemPayload) => {
  try {
    const res = await api.post(ORDER_ITEM_ENPOINTS.CREATE_ORDER_ITEM, data);
    return res;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Unable to create a new order-item.';
    throw new Error(message);
  }
};

export const deleteOrderItem = async (orderItemId: string) => {
  try {
    const res = await api.delete(`${ORDER_ITEM_ENPOINTS.DELETE_ORDER_ITEM}/${orderItemId}`);
    return res;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Unable to delete order-item.';
    throw new Error(message);
  }
};

export const updateOrderItem = async (orderItemId: string, orderItem: UpdateOrderItemPayload) => {
  try {
    const res = await api.post(
      `${ORDER_ITEM_ENPOINTS.UPDATE_ORDER_ITEM}/${orderItemId}`,
      orderItem,
    );
    return res;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Unable to delete order-item.';
    throw new Error(message);
  }
};
