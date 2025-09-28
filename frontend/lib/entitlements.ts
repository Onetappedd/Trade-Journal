import { createClient } from '@/lib/supabase/client'

export async function getIsPremium(userId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('user_entitlements').select('is_premium').eq('user_id', userId).single()
  return !!data?.is_premium
}

export type BillingState = 'active' | 'trial' | 'grace' | 'canceled' | 'none'
export async function getBillingState(userId: string): Promise<BillingState> {
  const supabase = createClient()
  const { data } = await supabase
    .from('billing_subscriptions')
    .select('*').eq('user_id', userId).order('updated_at', { ascending: false }).limit(1).maybeSingle()
  if (!data) return 'none'
  const now = Date.now()
  const end = new Date(data.current_period_end).getTime()
  const inGrace = now <= end + 3 * 24 * 3600 * 1000
  if (data.status === 'trialing') return 'trial'
  if (data.status === 'active') return 'active'
  if (inGrace) return 'grace'
  return 'canceled'
}
