import { createClient, SupabaseClient } from '@supabase/supabase-js'
import React, { createContext, useContext } from 'react'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const STORAGE_KEY = 'zk-tradejournal-auth-v2'

let _supabase: SupabaseClient | undefined = undefined

function _createSingletonClient(): SupabaseClient {
  if (typeof window !== 'undefined') {
    if ((window as any).__supabaseInstanceCreated) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('[Supabase] Client already instantiated in this browser context!')
      }
    } else {
      (window as any).__supabaseInstanceCreated = true
    }
    // HMR: cache on globalThis in dev
    if (process.env.NODE_ENV === 'development') {
      if ((globalThis as any).__sb) return (globalThis as any).__sb
      const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          storageKey: STORAGE_KEY,
        },
      })
      ;(globalThis as any).__sb = client
      return client
    }
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      storageKey: STORAGE_KEY,
    },
  })
}

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!_supabase) {
    _supabase = _createSingletonClient()
  }
  return _supabase
}

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
