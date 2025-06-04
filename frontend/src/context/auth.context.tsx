import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import * as authService from '@/services/auth.service';
import * as userService from '@/services/user.service';
import type { LogininPayload, SignupPayload, UserPaswordUpdate } from '@/schemas/auth.schema';
import type { User } from '@/types/user.types';
import type { UpdateUserData } from '@/schemas/user.schema';

interface AuthContextType {
  user: User | null;
  login: (credentials: LogininPayload) => Promise<User>;
  signup: (data: SignupPayload) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  updateUser: (data: UpdateUserData) => Promise<User>;
  updateUserPasword: (data: UserPaswordUpdate) => Promise<User>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  //Restore user from localStorage on first render
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (credentials: LogininPayload) => {
    const userData = await authService.login(credentials);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData)); // Save session
    return userData;
  };

  const signup = async (data: SignupPayload) => {
    const userData = await authService.signup(data);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData)); // Save session
    return userData;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    localStorage.removeItem('user'); // Clear session
  };

  const updateUser = async (data: UpdateUserData) => {
    const userChange = await userService.updateUser(data);
    setUser(userChange.data);
    localStorage.setItem('user', JSON.stringify(userChange.data)); // Keep updated
    return userChange;
  };

  const updateUserPasword = async (data: UserPaswordUpdate) => {
    const userPasswordUpdate = await authService.updatePassword(data);
    setUser(userPasswordUpdate);
    localStorage.setItem('user', JSON.stringify(userPasswordUpdate)); // optional
    return userPasswordUpdate;
  };

  return (
    <AuthContext.Provider
      value={{ user, login, signup, logout, setUser, updateUser, updateUserPasword }}
    >
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
