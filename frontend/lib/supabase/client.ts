"use client";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

let _client: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn(
      "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Client queries will fail."
    );
  }

  _client = createSupabaseClient(url ?? "", key ?? "", { auth: { persistSession: true } });
  return _client;
}
