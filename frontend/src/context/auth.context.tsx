import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import * as authService from '@/services/auth.service';
import * as userService from '@/services/user.service';
import type { LogininPayload, SignupPayload } from '@/schemas/auth.schema';
import type { User } from '@/types/user.types';
import type { UpdateUserData } from '@/schemas/user.schema';

interface AuthContextType {
  user: User | null;
  login: (credentials: LogininPayload) => Promise<User>;
  signup: (data: SignupPayload) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  updateUser: (data: UpdateUserData) => Promise<User>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (credentials: LogininPayload) => {
    const userData = await authService.login(credentials);
    setUser(userData);
    return userData;
  };

  const signup = async (data: SignupPayload) => {
    const userData = await authService.signup(data);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateUser = async (data: UpdateUserData) => {
    const userChange = await userService.updateUser(data);
    console.log('userChange: ', userChange);
    setUser(userChange.data);
    return userChange;
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, setUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
