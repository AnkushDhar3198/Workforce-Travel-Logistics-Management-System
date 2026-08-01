import React, { createContext, useContext, useState } from 'react';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  phone: string;
  managerId: number | null;
}

export interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
export const API_BASE = `${BACKEND_URL}/api`;

export const getFileUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://localhost:8080')) {
    return url.replace('http://localhost:8080', BACKEND_URL);
  }
  if (url.startsWith('/')) {
    return `${BACKEND_URL}${url}`;
  }
  return url;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('jwt_token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user_details');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('jwt_token', newToken);
    localStorage.setItem('user_details', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_details');
    setToken(null);
    setUser(null);
  };

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    return fetch(url, { ...options, headers });
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
};
