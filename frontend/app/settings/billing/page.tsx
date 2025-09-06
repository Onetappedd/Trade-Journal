import { createClient } from '@supabase/supabase-js'
import { getBillingState } from '@/lib/entitlements'

async function getUser() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await supabase.auth.getUser()
  return data.user
}

export default async function BillingPage() {
  const user = await getUser()
  if (!user) return <div className="p-8">Please sign in.</div>
  const state = await getBillingState(user.id)

  async function startCheckout(priceId: string) {
    'use server'
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    })
    const { url } = await res.json()
    if (url) { return { redirect: url } }
    return {}
  }

  async function openPortal() {
    'use server'
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/portal`, { method: 'POST' })
    const { url } = await res.json()
    if (url) { return { redirect: url } }
    return {}
  }

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Billing</h1>
      <div className="text-sm">Status: <span className="font-mono">{state}</span></div>

      <form action={async () => await startCheckout(process.env.PRICE_MONTHLY_ID!)}><button className="px-4 py-2 rounded bg-emerald-600 text-white">Upgrade – Monthly</button></form>
      <form action={async () => await startCheckout(process.env.PRICE_ANNUAL_ID!)}><button className="px-4 py-2 rounded bg-emerald-700 text-white">Upgrade – Annual</button></form>
      <form action={openPortal}><button className="px-4 py-2 rounded border">Manage billing</button></form>
    </div>
  )
}
