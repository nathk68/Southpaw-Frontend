'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AccessLevel } from '@/lib/whop';

interface User {
  id: string;
  email?: string;
  username?: string;
}

interface AuthContextType {
  user: User | null;
  access: AccessLevel | null;
  loading: boolean;
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [access, setAccess] = useState<AccessLevel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch session on mount
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();

      setUser(data.user || null);
      setAccess(data.access || null);
    } catch (error) {
      console.error('Failed to fetch session:', error);
      setUser(null);
      setAccess(null);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    // Redirect to Discord OAuth
    window.location.href = '/api/auth/discord';
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
      setUser(null);
      setAccess(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, access, loading, login, logout }}>
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
