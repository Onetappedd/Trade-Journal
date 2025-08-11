// Env guard for sanity checks
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let warned = false
export function checkSupabaseEnv() {
  if (warned) return
  let bad = false
  if (!url || !key) {
    bad = true
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.warn('[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }
  }
  if (url && url.endsWith('/')) {
    bad = true
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.warn('[Supabase] NEXT_PUBLIC_SUPABASE_URL should not have a trailing slash:', url)
    }
  }
  warned = true
  return !bad
}
