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

  // Create service role client for accessing SnapTrade data
  const { createClient: createSBClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createSBClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch manual trade data from database
  const { data: trades, error: tradesError } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (tradesError) {
    console.error('Error fetching trades:', tradesError)
  }

  // Fetch SnapTrade broker data
  const { data: snaptradeAccounts } = await supabaseAdmin
    .from('snaptrade_accounts')
    .select('*')
    .eq('user_id', user.id)

  const { data: brokerVerification } = await supabaseAdmin
    .from('user_broker_verification')
    .select('is_broker_verified, last_verified_at')
    .eq('user_id', user.id)
    .single()

  // Calculate broker portfolio value
  const brokerPortfolioValue = snaptradeAccounts?.reduce(
    (sum, acc) => sum + (acc.total_value || 0),
    0
  ) || 0

  // Calculate manual trade metrics
  const dayPnL = trades?.filter(t => {
    const tradeDate = new Date(t.entry_date || t.created_at)
    const today = new Date()
    return tradeDate.toDateString() === today.toDateString()
  }).reduce((sum, t) => sum + (t.pnl || 0), 0) || 0

  const manualPortfolioValue = trades?.reduce((sum, t) => sum + (t.entry_price * t.quantity), 0) || 0

  // Combine broker + manual data
  const totalPortfolioValue = brokerPortfolioValue + manualPortfolioValue
  const hasBrokerData = brokerVerification?.is_broker_verified || false

  const dashboardData: DashboardData = {
    dayPnL,
    portfolioValue: totalPortfolioValue,
    trades: trades || [],
    positions: [], // TODO: Calculate from trades
    risk: { 
      maxDrawdownPct: 0, // TODO: Calculate from trades
      sharpe: 0, 
      beta: 0, 
      volPct: 0 
    },
    integrations: hasBrokerData 
      ? [{ name: 'SnapTrade', status: 'connected' }]
      : [{ name: 'SnapTrade', status: 'needs_auth' }],
    brokerData: hasBrokerData ? {
      accounts: snaptradeAccounts || [],
      totalValue: brokerPortfolioValue,
      lastSync: brokerVerification?.last_verified_at || null,
    } : undefined,
  }

  return <DashboardClient user={user} dashboardData={dashboardData} />
}