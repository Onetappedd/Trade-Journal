import { createClient } from './supabase/client';
import React, { createContext, useContext } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

// Use the singleton client to prevent multiple instances
export function getSupabaseBrowserClient(): SupabaseClient {
  return createClient();
}

const SupabaseContext = createContext<SupabaseClient | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const client = getSupabaseBrowserClient();
  return <SupabaseContext.Provider value={client}>{children}</SupabaseContext.Provider>;
}

export function useSupabase() {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error('useSupabase must be used within SupabaseProvider');
  return ctx;
}
