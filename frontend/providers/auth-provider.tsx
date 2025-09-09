"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

type AuthCtx = {
  supabase: ReturnType<typeof createClient>;
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
    if (process.env.NODE_ENV === 'development') {
      console.log('AuthProvider - Creating Supabase client using centralized client');
    }
    return createClient();
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
      
              // Ensure the session is properly set for database requests
              if (data.session) {
                supabase.auth.setSession(data.session).then(() => {
                  console.log('AuthProvider - Session set for database requests');
                  
                  // The session is now properly set, which should include the JWT token in all requests
                  console.log('AuthProvider - JWT token should now be included in all database requests');
                });
              }
      
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('AuthProvider - Auth state change:', { event, hasSession: !!s, userId: s?.user?.id });
      }
      setSession(s);
      
              // Ensure the session is properly set for database requests
              if (s) {
                supabase.auth.setSession(s).then(() => {
                  console.log('AuthProvider - Session updated for database requests');
                  
                  // The session is now properly set, which should include the JWT token in all requests
                  console.log('AuthProvider - JWT token should now be included in all database requests');
                });
              }
      
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
