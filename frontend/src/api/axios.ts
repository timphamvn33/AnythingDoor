import axios from 'axios';
import { getAccessToken, clearTokens } from '@/utils/token';
import { refreshToken } from '@/services/auth.service';
import { logTheUserout } from '@/services/auto-logout';
import { AUTH_ENDPOINTS } from '@/api/endpoints';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/',
  withCredentials: true,
});

// Attach access token to every request
api.interceptors.request.use(config => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  res => res,
  async error => {
    const originalRequest = error.config;

    const requestUrl: string = originalRequest?.url || '';
    const isPublicAuthRequest = [
      AUTH_ENDPOINTS.LOGIN,
      AUTH_ENDPOINTS.SIGNUP,
      AUTH_ENDPOINTS.REFRESH_TOKEN,
    ].some(endpoint => requestUrl.includes(endpoint));

    if (error.response?.status === 401 && !originalRequest._retry && !isPublicAuthRequest) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = 'Bearer ' + token;
              resolve(api(originalRequest));
            },
            reject: (err: any) => reject(err),
          });
        });
      }

      isRefreshing = true;

      try {
        const { accessToken } = await refreshToken();
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = 'Bearer ' + accessToken;
        return api(originalRequest);
      } catch (err) {
        // log the user out when unabale to refresh token
        logTheUserout();
        processQueue(err, null);
        clearTokens();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
