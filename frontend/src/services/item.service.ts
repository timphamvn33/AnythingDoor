import api from '@/api/axios';
import { ITEMS_ENDPOINTS } from '@/api/endpoints';
import type { ItemPayload } from '@/schemas/item.schema';

export const createItem = async (data: ItemPayload) => {
  try {
    const res = await api.post(ITEMS_ENDPOINTS.CREATE_ITEM, data);
    return res;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Unable to add the new item.';
    throw new Error(message);
  }
};
