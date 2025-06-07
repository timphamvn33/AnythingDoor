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

export const updateItem = async (itemId: String, data: ItemPayload) => {
  try {
    const res = await api.post(`${ITEMS_ENDPOINTS.UPDATE_ITEM}/${itemId}`, data);
    return res;
  } catch (error: any) {
    const message = error.response?.data?.message || `Unable to update item ${data.name}`;
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

export const deleteItemByItemId = async (itemId: string) => {
  try {
    const res = api.delete(`${ITEMS_ENDPOINTS.DELETE_ITEM}/${itemId}`);
    return res;
  } catch (error: any) {
    console.log('unable to delete the item');
  }
};
