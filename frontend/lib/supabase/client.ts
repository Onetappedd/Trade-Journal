"use client";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Global singleton to prevent multiple instances
let _client: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createClient() {
  // Return existing client if available
  if (_client) return _client;
  
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Fallback to hardcoded values if environment variables are not set
  if (!url || !key) {
    console.warn(
      "[supabase] Missing environment variables, using fallback values. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    );
    
    // Use the values from SUPABASE_SETUP.md as fallback
    url = url || 'https://lobigrwmngwirucuklmc.supabase.co';
    key = key || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvYmlncndtbmd3aXJ1Y3VrbG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MjAzODgsImV4cCI6MjA2OTQ5NjM4OH0.FZvlw06ILW7TutkrakBLdEIEkuf5f69nGxXaycaMGQQ';
    
    console.log("[supabase] Using fallback configuration:", { url, hasKey: !!key });
  }

  // Create client with proper configuration to prevent multiple instances
  _client = createSupabaseClient<Database>(url, key, { 
    auth: { 
      persistSession: true,
      storageKey: 'sb-localhost-auth-token', // Match the expected storage key
      autoRefreshToken: true,
      detectSessionInUrl: true
    } 
  });
  
  return _client;
}
