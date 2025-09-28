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

  // Fetch real trade data from database
  const { data: trades, error: tradesError } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (tradesError) {
    console.error('Error fetching trades:', tradesError)
  }

  // Calculate KPIs from real data
  const dayPnL = trades?.filter(t => {
    const tradeDate = new Date(t.entry_date || t.created_at)
    const today = new Date()
    return tradeDate.toDateString() === today.toDateString()
  }).reduce((sum, t) => sum + (t.pnl || 0), 0) || 0

  const portfolioValue = trades?.reduce((sum, t) => sum + (t.entry_price * t.quantity), 0) || 0

  const dashboardData: DashboardData = {
    dayPnL,
    portfolioValue,
    trades: trades || [],
    positions: [], // TODO: Calculate from trades
    risk: { 
      maxDrawdownPct: 0, // TODO: Calculate from trades
      sharpe: 0, 
      beta: 0, 
      volPct: 0 
    },
    integrations: [{ name: 'TopstepX', status: 'needs_auth' }],
  }

  return <DashboardClient user={user} dashboardData={dashboardData} />
}