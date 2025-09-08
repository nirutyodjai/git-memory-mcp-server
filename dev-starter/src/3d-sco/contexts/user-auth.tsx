'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/auth';

interface UserAuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; bio?: string }) => Promise<{ success: boolean; error?: string }>;
  checkAuth: () => Promise<void>;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
  name?: string;
  bio?: string;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

export function UserAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (identifier: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setUser(result.user);
        return { success: true };
      } else {
        return { success: false, error: result.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก' };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (data: { name?: string; bio?: string }) => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setUser(result.user);
        return { success: true };
      } else {
        return { success: false, error: result.error || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' };
    }
  };

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Check auth error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <UserAuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        checkAuth,
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const context = useContext(UserAuthContext);
  if (context === undefined) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
}