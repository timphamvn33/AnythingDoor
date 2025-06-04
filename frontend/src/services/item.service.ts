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

export const getAllItemByStore = async (storeId: string) => {
  try {
    const res = api.get(`${ITEMS_ENDPOINTS.GET_ALL_ITEM}/${storeId}`);
    return res;
  } catch (error: any) {
    console.log('unable to get the items by store id');
  }
};
