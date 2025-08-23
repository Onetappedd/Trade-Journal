"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Session } from "@supabase/auth-helpers-nextjs";

type AuthCtx = {
  supabase: ReturnType<typeof createClientComponentClient>;
  session: Session | null;
  userId: string | null;
};

const Ctx = createContext<AuthCtx | null>(null);

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within an AuthProvider");
  return v;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub?.subscription?.unsubscribe();
  }, [supabase]);

  const value = useMemo(
    () => ({ supabase, session, userId: session?.user?.id ?? null }),
    [supabase, session]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
