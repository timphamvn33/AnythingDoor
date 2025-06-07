import api from '@/api/axios';
import { STORE_ENDPOINTS } from '@/api/endpoints';
import type { StorePayload } from '@/schemas/store.schema';

export const createStore = async (data: StorePayload) => {
  try {
    const res = api.post(STORE_ENDPOINTS.CREATE_STORE, data);
    return res;
  } catch (error: any) {
    console.log('unable to create a new store: ', error);
  }
};

export const getStores = async (ownerId: string) => {
  try {
    const res = api.get(`${STORE_ENDPOINTS.GET_STORES}/${ownerId}`);
    return res;
  } catch (error: any) {
    console.log('unable to get the stores: ', error);
  }
};

export const getStoreById = async (storeId: string) => {
  try {
    const res = api.get(`${STORE_ENDPOINTS.GET_STORE}/${storeId}`);
    return res;
  } catch (error: any) {
    console.log('unable to get the store by store id: ', error);
  }
};

export const deleteStoreById = async (storeId: string) => {
  try {
    const res = api.delete(`${STORE_ENDPOINTS.DELETE_STORE}/${storeId}`);
    return res;
  } catch (error: any) {
    console.log('unable to delete the store by store id');
  }
};

export const updateByStoreId = async (storeId: string, storeUpdatePayload: StorePayload) => {
  try {
    const res = api.post(`${STORE_ENDPOINTS.UPDATE_STORE}/${storeId}`, storeUpdatePayload);
    return res;
  } catch (error: any) {
    const message =
      error.response?.data?.message || `Unable to update store ${storeUpdatePayload.name}`;
    throw new Error(message);
  }
};
