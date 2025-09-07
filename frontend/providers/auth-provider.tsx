"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { Session } from "@supabase/supabase-js";

type AuthCtx = {
  supabase: ReturnType<typeof createBrowserClient>;
  session: Session | null;
  user: Session['user'] | null;
  userId: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) {
    // prevent crash during unexpected SSR or missing provider
    return { 
      supabase: null, 
      session: null, 
      user: null, 
      userId: null, 
      loading: true,
      signOut: async () => {} 
    };
  }
  return v;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (process.env.NODE_ENV === 'development') {
      console.log('AuthProvider - Creating Supabase client:', { hasUrl: !!url, hasKey: !!key });
    }
    return createBrowserClient(url!, key!);
  }, []);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('AuthProvider - Initializing auth...');
    }
    supabase.auth.getSession().then(({ data }) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('AuthProvider - Initial session:', { hasSession: !!data.session, userId: data.session?.user?.id });
      }
      setSession(data.session ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('AuthProvider - Auth state change:', { event, hasSession: !!s, userId: s?.user?.id });
      }
      setSession(s);
      setLoading(false);
    });
    return () => subscription?.unsubscribe();
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  const value = useMemo(
    () => ({ 
      supabase, 
      session, 
      user: session?.user ?? null,
      userId: session?.user?.id ?? null,
      loading,
      signOut
    }),
    [supabase, session, loading, signOut]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
