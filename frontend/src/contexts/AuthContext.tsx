import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  login: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUsers: Record<UserRole, User> = {
  admin: {
    id: '1',
    name: 'Kouassi Mensah',
    email: 'kouassi@iphoneshop.bj',
    role: 'admin',
  },
  collaborator: {
    id: '2',
    name: 'Amina Dossou',
    email: 'amina@iphoneshop.bj',
    role: 'collaborator',
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('admin');
  const [user, setUser] = useState<User | null>(mockUsers.admin);

  const login = (newRole: UserRole) => {
    setRole(newRole);
    setUser(mockUsers[newRole]);
  };

  const logout = () => {
    setUser(null);
    setRole('admin');
  };

  const handleSetRole = (newRole: UserRole) => {
    setRole(newRole);
    setUser(mockUsers[newRole]);
  };

  return (
    <AuthContext.Provider value={{ user, role, setRole: handleSetRole, login, logout }}>
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
