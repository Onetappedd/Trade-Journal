import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import DashboardClient from './_client/DashboardClient'
import { DashboardData } from '@/types/dashboard'

export default async function DashboardPage() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    // middleware should redirect; render nothing here
    return null
  }

  // TODO: Replace this with real queries against your tables.
  // For now, return empty-safe defaults.
  const dashboardData: DashboardData = {
    dayPnL: 0,
    portfolioValue: 0,
    trades: [],
    positions: [],
    risk: { maxDrawdownPct: 0, sharpe: 0, beta: 0, volPct: 0 },
    integrations: [{ name: 'TopstepX', status: 'needs_auth' }],
  }

  return <DashboardClient user={user} dashboardData={dashboardData} />
}