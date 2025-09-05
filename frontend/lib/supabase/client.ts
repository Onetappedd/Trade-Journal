"use client";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Global singleton to prevent multiple instances
let _client: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createClient() {
  // Return existing client if available
  if (_client) return _client;
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn(
      "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Client queries will fail."
    );
  }

  // Create client with proper configuration to prevent multiple instances
  _client = createSupabaseClient<Database>(url ?? "", key ?? "", { 
    auth: { 
      persistSession: true,
      storageKey: 'riskr-supabase-auth-v1' // Unique storage key
    } 
  });
  
  return _client;
}
