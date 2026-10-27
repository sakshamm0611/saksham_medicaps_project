import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest, UserSafe } from '../services/api';

interface AuthContextType {
  user: UserSafe | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (token: string, user: UserSafe) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('imovies_token'));
  const [user, setUser] = useState<UserSafe | null>(() => {
    const saved = localStorage.getItem('imovies_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('imovies_token');
    localStorage.removeItem('imovies_user');
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback((newToken: string, newUser: UserSafe) => {
    localStorage.setItem('imovies_token', newToken);
    localStorage.setItem('imovies_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const refreshUser = useCallback(async () => {
    const curToken = localStorage.getItem('imovies_token');
    if (!curToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await apiRequest<{ success: boolean; user: UserSafe }>('/api/auth/me');
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('imovies_user', JSON.stringify(res.user));
      }
    } catch (err) {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    refreshUser();

    const handleAuthChange = () => {
      setToken(localStorage.getItem('imovies_token'));
      const saved = localStorage.getItem('imovies_user');
      setUser(saved ? JSON.parse(saved) : null);
    };

    window.addEventListener('auth_change', handleAuthChange);
    return () => window.removeEventListener('auth_change', handleAuthChange);
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isAdmin: user?.role === 'admin',
        loading,
        login,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
