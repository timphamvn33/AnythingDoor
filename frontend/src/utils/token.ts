export const getAccessToken = () => localStorage.getItem('accessToken');
export const getRefreshToken = () => localStorage.getItem('refreshToken');

export const saveTokens = (access: string, refresh: string) => {
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
};

export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};
