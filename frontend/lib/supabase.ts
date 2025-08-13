import { getSupabaseBrowserClient } from "./supabase-browser"

// Return the singleton browser client everywhere to avoid multiple GoTrue instances
export function createClient() {
  return getSupabaseBrowserClient()
}
