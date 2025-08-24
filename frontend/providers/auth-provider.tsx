"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { Session } from "@supabase/supabase-js";

type AuthCtx = {
  supabase: ReturnType<typeof createBrowserClient>;
  session: Session | null;
  user: Session['user'] | null;
  userId: string | null;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within an AuthProvider");
  return v;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
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
      signOut
    }),
    [supabase, session, signOut]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
