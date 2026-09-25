/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Role = 'Admin' | 'Agent' | null;

interface AuthState {
  username: string | null;
  role: Role;
  token: string | null;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (username: string, role: Role, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    username: null,
    role: null,
    token: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Check if the user is authenticated via httpOnly cookie
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me'); // Next.js rewrite will forward cookie
        if (res.ok) {
          const data = await res.json();
          setAuthState({
            username: data.username,
            role: data.role,
            token: null, // token is now stored securely in cookie
            isAuthenticated: true,
          });
        }
      } catch (e) {
        console.error('Failed to verify session');
      }
    };
    checkAuth();
  }, []);

  const login = (username: string, role: Role, token: string) => {
    // The backend already set the httpOnly cookie
    setAuthState({ username, role, token: null, isAuthenticated: true });
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch(e) {}
    setAuthState({ username: null, role: null, token: null, isAuthenticated: false });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
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
