import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, apiJson } from '../lib/api';

type UserRole = 'student' | 'parent' | 'teacher' | 'admin';

interface User {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithStudentId: (studentId: string, password: string) => Promise<boolean>;
  loginWithToken: (token: string, user: { id: string; email: string; role: string }) => void;
  sendOtp: (phone: string) => Promise<{ success: boolean; devOtp?: string }>;
  loginWithOtp: (phone: string, otp: string) => Promise<boolean>;
  register: (data: { email: string; password: string; role: UserRole } & Record<string, unknown>) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [t, u] = await Promise.all([
          AsyncStorage.getItem('token'),
          AsyncStorage.getItem('user'),
        ]);
        if (t && u) {
          setToken(t);
          setUser(JSON.parse(u));
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const persist = async (t: string, u: User) => {
    await AsyncStorage.setItem('token', t);
    await AsyncStorage.setItem('user', JSON.stringify(u));
  };

  const login = async (email: string, password: string) => {
    try {
      const data = await apiJson<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      setUser(data.user);
      await persist(data.token, data.user);
      return true;
    } catch {
      return false;
    }
  };

  const loginWithToken = async (t: string, u: { id: string; email: string; role: string }) => {
    setToken(t);
    const userObj = { ...u, role: u.role as UserRole };
    setUser(userObj);
    await AsyncStorage.setItem('token', t);
    await AsyncStorage.setItem('user', JSON.stringify(userObj));
  };

  const loginWithStudentId = async (studentId: string, password: string) => {
    try {
      const data = await apiJson<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ type: 'student', studentId, password }),
      });
      setToken(data.token);
      setUser(data.user);
      await persist(data.token, data.user);
      return true;
    } catch {
      return false;
    }
  };

  const sendOtp = async (phone: string) => {
    try {
      const res = await api('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      const data = (await res.json()) as { error?: string; devOtp?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      return { success: true, devOtp: data.devOtp };
    } catch {
      return { success: false };
    }
  };

  const loginWithOtp = async (phone: string, otp: string) => {
    try {
      const data = await apiJson<{ token: string; user: User }>('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, otp }),
      });
      setToken(data.token);
      setUser(data.user);
      await persist(data.token, data.user);
      return true;
    } catch {
      return false;
    }
  };

  const register = async (data: { email: string; password: string; role: UserRole } & Record<string, unknown>) => {
    try {
      const result = await apiJson<{ token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setToken(result.token);
      setUser(result.user);
      await persist(result.token, result.user);
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.multiRemove(['token', 'user']);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, loginWithStudentId, loginWithToken, sendOtp, loginWithOtp, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
