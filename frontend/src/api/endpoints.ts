// central place for backend routes
export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  LOGOUT: '/auth/logout',
  UPDATE_PASSWORD: '/auth/update',
  REFRESH_TOKEN: '/auth/refresh-token',
  ADMIN: '/auth/admin',
};

export const USERS_ENDPOINTS = {
  USERUPDATE: '/users/update-profile',
};

export const ITEMS_ENDPOINTS = {
  CREATE_ITEM: 'menu-items/create',
  UPDATE_ITEM: 'menu-items/update',
};

export const STORE_ENDPOINTS = {
  CREATE_STORE: 'restaurant/create',
  GET_STORES: 'restaurant/owner',
  GET_STORE: 'restaurant',
};
