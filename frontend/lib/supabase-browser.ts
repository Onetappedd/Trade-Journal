import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const STORAGE_KEY = 'zk-tradejournal-auth'

let _supabase: SupabaseClient | undefined = undefined

export function getSupabaseBrowserClient(): SupabaseClient {
  if (typeof window !== 'undefined') {
    if ((window as any).__supabaseInstanceCreated) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('Supabase client already instantiated in this browser context!')
      }
    } else {
      (window as any).__supabaseInstanceCreated = true
    }
  }
  if (!_supabase) {
    _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        storageKey: STORAGE_KEY,
      },
    })
  }
  return _supabase
}

import React, { createContext, useContext } from 'react'

const SupabaseContext = createContext<SupabaseClient | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const client = getSupabaseBrowserClient()
  return <SupabaseContext.Provider value={client}>{children}</SupabaseContext.Provider>
}

export function useSupabase() {
  const ctx = useContext(SupabaseContext)
  if (!ctx) throw new Error('useSupabase must be used within SupabaseProvider')
  return ctx
}
