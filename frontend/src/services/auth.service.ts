import api from '@/api/axios';
import { AUTH_ENDPOINTS } from '@/api/endpoints';
import type { LogininPayload, SignupPayload } from '@/schemas/auth.schema';
import { saveTokens, clearTokens } from '@/utils/token';

export const login = async (data: LogininPayload) => {
  try {
    const res = await api.post(AUTH_ENDPOINTS.LOGIN, data);
    const { accessToken, refreshToken, user } = res.data;
    saveTokens(accessToken, refreshToken);
    return user;
  } catch (error: any) {
    console.error('Login error:', error.response?.data || error.message);
    throw error;
  }
};

export const signup = async (data: SignupPayload) => {
  try {
    const res = await api.post(AUTH_ENDPOINTS.SIGNUP, data);
    const { accessToken, refreshToken, user } = res.data;
    saveTokens(accessToken, refreshToken);
    return user;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Signup failed. Please try again.';
    throw new Error(message);
  }
};

export const logout = async () => {
  await api.post(AUTH_ENDPOINTS.LOGOUT);
  clearTokens();
};

export const updatePassword = async (data: { id: string; password: string }) => {
  const res = await api.post(AUTH_ENDPOINTS.UPDATE_PASSWORD, data);
  const { accessToken, refreshToken, user } = res.data;
  saveTokens(accessToken, refreshToken);
  return user;
};

export const refreshToken = async () => {
  const refresh = localStorage.getItem('refreshToken');

  if (!refresh) throw new Error('No refresh token found');
  console.log('refreshtoken');

  const res = await api.post(AUTH_ENDPOINTS.REFRESH_TOKEN, { refreshToken: refresh });
  const { accessToken, refreshToken: newRefresh, user } = res.data;
  saveTokens(accessToken, newRefresh);
  localStorage.setItem('user', JSON.stringify(user));

  console.log('[Token Refreshed]', new Date().toISOString(), accessToken);
  return { accessToken, refreshToken: newRefresh, user };
};

export const getAdminData = async () => {
  const res = await api.get(AUTH_ENDPOINTS.ADMIN);
  return res.data;
};

export const getStoredUser = () => {
  const stored = localStorage.getItem('user');
  return stored ? JSON.parse(stored) : null;
};
