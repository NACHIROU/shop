import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { authApi } from '@/services/api';

export type UserRole = 'admin' | 'collaborator';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; phone: string; password: string }) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('admin');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // TODO: Validate token and set user
      // For now, assume valid
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setRole(JSON.parse(storedUser).role);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      const userData = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role,
      };
      setUser(userData);
      setRole(response.user.role);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: { name: string; email: string; phone: string; password: string }) => {
    try {
      const response = await authApi.register(data);
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      const userData = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role,
      };
      setUser(userData);
      setRole(response.user.role);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setRole('admin');
  };

  const handleSetRole = (newRole: UserRole) => {
    setRole(newRole);
  };

  return (
    <AuthContext.Provider value={{ user, role, setRole: handleSetRole, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
