import { jwtDecode } from 'jwt-decode';
import { clearTokens, getAccessToken } from '@/utils/token';
import { toast } from 'sonner';

export const scheduleAutoLogout = () => {
  const token = getAccessToken();
  if (!token) return;

  const { exp } = jwtDecode<{ exp: number }>(token);
  const expiresAt = exp * 1000;
  const now = Date.now();

  const timeout = expiresAt - now;

  if (timeout > 0) {
    setTimeout(() => {
      logTheUserout();
    }, timeout);
  }
};

export const logTheUserout = () => {
  clearTokens();
  toast.warning('Session expired. You have been logged out.');
  setTimeout(() => {
    window.location.href = '/sign-in';
  }, 1000);
};
