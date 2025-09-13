'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';

type AuthContextType = {
  user: any;
  loading: boolean;
  signIn: (...args: any[]) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Minimal placeholder state; hook up to your real auth later.
  const [user] = useState<any>(null);
  const [loading] = useState<boolean>(false);
  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      signIn: async () => {},
      signOut: async () => {},
    }),
    [user, loading]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
