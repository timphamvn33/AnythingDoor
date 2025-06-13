import api from '@/api/axios';
import { ORDER_ENDPOINTS } from '@/api/endpoints';
import type { CreateOrderItemPayload } from '@/schemas/order-item.schema';
import type { CreateOrderPayload, UpdateOrderItemPayload } from '@/schemas/order.schema';

export const createOrder = async (data: CreateOrderPayload) => {
  try {
    const res = await api.post(ORDER_ENDPOINTS.CREATE_ORDER, data);
    return res;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Unable to create a new order.';
    throw new Error(message);
  }
};

export const initOrAddItem = async (userId: string, data: CreateOrderItemPayload) => {
  try {
    const res = await api.post(`${ORDER_ENDPOINTS.INIT_OR_ADD_ITEM}/${userId}`, data);
    return res;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Unable to init or create a new order item.';
    throw new Error(message);
  }
};

export const getOrderByUserId = async (userId: string) => {
  try {
    const res = await api.get(`${ORDER_ENDPOINTS.GET_ORDER_BY_USER_ID}/${userId}`);
    return res;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Unable to get the order by userId.';
    throw new Error(message);
  }
};

export const updateOrder = async (orderId: string, data: UpdateOrderItemPayload) => {
  try {
    const res = await api.post(`${ORDER_ENDPOINTS.UPDATE_ORDER}/${orderId}`, data);
    return res;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Unable to update the order.';
    throw new Error(message);
  }
};

export const deleteOrder = async (orderId: string) => {
  try {
    const res = await api.delete(`${ORDER_ENDPOINTS.DELETE_ORDER}/${orderId}`);
    return res;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Unable to delete the order.';
    throw new Error(message);
  }
};
