import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, apiJson } from '@/lib/api';

type UserRole = 'student' | 'parent' | 'teacher' | 'admin';

interface User {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, recaptchaToken?: string) => Promise<boolean>;
  loginWithStudentId: (studentId: string, password: string, recaptchaToken?: string) => Promise<boolean>;
  loginWithToken: (token: string, user: { id: string; email: string; role: string }) => void;
  sendOtp: (phone: string, recaptchaToken?: string) => Promise<{ success: boolean; devOtp?: string }>;
  loginWithOtp: (phone: string, otp: string) => Promise<boolean>;
  register: (data: { email: string; password: string; role: UserRole } & Record<string, unknown>, recaptchaToken?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, recaptchaToken?: string) => {
    try {
      const data = await apiJson<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, recaptchaToken }),
      });
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return true;
    } catch {
      return false;
    }
  };

  const loginWithToken = (token: string, user: { id: string; email: string; role: string }) => {
    setToken(token);
    setUser({ ...user, role: user.role as UserRole });
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const loginWithStudentId = async (studentId: string, password: string, recaptchaToken?: string) => {
    try {
      const data = await apiJson<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ type: 'student', studentId, password, recaptchaToken }),
      });
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return true;
    } catch {
      return false;
    }
  };

  const sendOtp = async (phone: string, recaptchaToken?: string) => {
    try {
      const res = await api('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, recaptchaToken }),
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
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return true;
    } catch {
      return false;
    }
  };

  const register = async (data: { email: string; password: string; role: UserRole } & Record<string, unknown>, recaptchaToken?: string) => {
    try {
      const result = await apiJson<{ token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ...data, recaptchaToken }),
      });
      setToken(result.token);
      setUser(result.user);
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
