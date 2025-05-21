import type { UpdateUserData } from '@/schemas/user.schema';
import api from '@/api/axios';
import { USERS_ENDPOINTS } from '@/api/endpoints';

export const updateUser = async (data: UpdateUserData): Promise<any> => {
  try {
    const res = await api.post(USERS_ENDPOINTS.USERUPDATE, data);
    return res;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Unable to update the user.';
    throw new Error(message);
  }
};
