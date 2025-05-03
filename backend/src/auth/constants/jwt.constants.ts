export const JWT_CONSTANTS = Object.freeze({
  ACCESS_TOKEN: {
    SECRET:
      process.env.JWT_ACCESS_SECRET ||
      'default-access-secret',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  },
  REFRESH_TOKEN: {
    SECRET:
      process.env.JWT_REFRESH_SECRET ||
      'default-refresh-secret',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  },
  STRATEGY_KEYS: {
    ACCESS: 'jwt-access',
    REFRESH: 'jwt-refresh',
  },
});
