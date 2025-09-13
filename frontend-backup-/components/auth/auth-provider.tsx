'use client';

import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';

// Dynamically detect browser for SSR safety
function getSupabaseClient() {
  if (typeof window === 'undefined') return null;
  // Use environment variables for browser edge
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    name?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // SSR-safe: Client is only defined in browser
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    // Use getUser() (not getSession())
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.auth.getUser();
      if (mounted) {
        setUser(error ? null : data.user);
        setLoading(false);
      }
    })();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // Only on client
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { success: false, error: 'Not in client environment' };
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    if (!supabase) return { success: false, error: 'Not in client environment' };
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: name || email.split('@')[0] } },
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
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
