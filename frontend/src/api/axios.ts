import axios from 'axios';
import { getAccessToken } from '@/utils/token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/',
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(config => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor (optional for refresh handling)
api.interceptors.response.use(
  res => res,
  async error => {
    // could refresh token here
    return Promise.reject(error);
  },
);

export default api;
