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
  GET_ALL_ITEM: 'menu-items/getAllItem',
  DELETE_ITEM: 'menu-items',
  GET_ALL: 'menu-items/all',
};

export const STORE_ENDPOINTS = {
  CREATE_STORE: 'restaurant/create',
  GET_STORES: 'restaurant/owner',
  GET_STORE: 'restaurant',
  DELETE_STORE: 'restaurant',
  UPDATE_STORE: 'restaurant/update',
};

export const ORDER_ITEM_ENPOINTS = {
  CREATE_ORDER_ITEM: 'order-items/create',
  DELETE_ORDER_ITEM: 'order-items',
  UPDATE_ORDER_ITEM: 'order-items/update',
};

export const ORDER_ENDPOINTS = {
  CREATE_ORDER: 'orders/create',
  GET_ORDER_BY_USER_ID: 'orders/user',
  UPDATE_ORDER: 'orders',
  INIT_OR_ADD_ITEM: 'orders/initOrAddItem',
  DELETE_ORDER: 'orders',
};
