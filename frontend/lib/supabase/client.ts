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
      storageKey: 'riskr-supabase-auth-v1', // Match the actual storage key being used
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web'
      }
    }
  });
  
  // Initialize the session from localStorage and ensure it's properly set
  _client.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      console.log('[supabase] Session restored from localStorage:', { 
        userId: session.user?.id, 
        email: session.user?.email,
        hasAccessToken: !!session.access_token
      });
      
      // Ensure the session is properly set for database requests
      _client.auth.setSession(session);
    } else {
      console.log('[supabase] No session found in localStorage');
    }
  });
  
  return _client;
}
