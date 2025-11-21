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
  // Note: Matching engine uses opened_at, avg_open_price, qty_opened, realized_pnl, instrument_type
  const { data: trades, error: tradesError } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', user.id)
    .order('opened_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(1000) // Increase limit to show more trades

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
  // Handle null/undefined values safely
  const dayPnL = trades?.filter(t => {
    const tradeDate = t.opened_at ? new Date(t.opened_at) : (t.created_at ? new Date(t.created_at) : null)
    if (!tradeDate) return false
    const today = new Date()
    return tradeDate.toDateString() === today.toDateString()
  }).reduce((sum, t) => {
    // Handle both string and number types (PostgreSQL NUMERIC returns as string in JSON)
    const pnl = typeof (t.realized_pnl ?? t.pnl) === 'string' 
      ? parseFloat(t.realized_pnl ?? t.pnl ?? '0') 
      : (t.realized_pnl ?? t.pnl ?? 0)
    return sum + (typeof pnl === 'number' && !isNaN(pnl) ? pnl : 0)
  }, 0) || 0

  const manualPortfolioValue = trades?.reduce((sum, t) => {
    // Handle both string and number types (PostgreSQL NUMERIC returns as string in JSON)
    // Use avg_open_price (matching engine) or fallback to entry_price/price
    const price = typeof (t.avg_open_price ?? t.entry_price ?? t.price) === 'string' 
      ? parseFloat(t.avg_open_price ?? t.entry_price ?? t.price ?? '0') 
      : (t.avg_open_price ?? t.entry_price ?? t.price ?? 0)
    // Use qty_opened (matching engine) or fallback to quantity
    const qty = typeof (t.qty_opened ?? t.quantity) === 'string' 
      ? parseFloat(t.qty_opened ?? t.quantity ?? '0') 
      : (t.qty_opened ?? t.quantity ?? 0)
    if (typeof price === 'number' && typeof qty === 'number' && !isNaN(price) && !isNaN(qty)) {
      return sum + (price * qty)
    }
    return sum
  }, 0) || 0

  // Combine broker + manual data
  const totalPortfolioValue = brokerPortfolioValue + manualPortfolioValue
  const hasBrokerData = brokerVerification?.is_broker_verified || false

  // Transform trades to match DashboardData Trade type
  // Map database fields to Trade interface (price, quantity, pnl, openedAt, closedAt)
  // Handle both matching engine schema (opened_at, avg_open_price, qty_opened, realized_pnl) 
  // and legacy schema (entry_date, entry_price, quantity, pnl)
  const transformedTrades = (trades || []).map((t: any) => ({
    id: t.id,
    symbol: t.symbol || 'UNKNOWN',
    side: (t.side || 'buy') as 'buy' | 'sell',
    quantity: typeof (t.qty_opened ?? t.quantity) === 'string' 
      ? parseFloat(t.qty_opened ?? t.quantity ?? '0') 
      : (t.qty_opened ?? t.quantity ?? 0),
    price: typeof (t.avg_open_price ?? t.entry_price ?? t.price) === 'string' 
      ? parseFloat(t.avg_open_price ?? t.entry_price ?? t.price ?? '0') 
      : (t.avg_open_price ?? t.entry_price ?? t.price ?? 0),
    pnl: typeof (t.realized_pnl ?? t.pnl) === 'string' 
      ? parseFloat(t.realized_pnl ?? t.pnl ?? '0') 
      : (t.realized_pnl ?? t.pnl ?? 0),
    openedAt: t.opened_at ?? t.executed_at ?? t.entry_date ?? new Date().toISOString(),
    closedAt: t.closed_at ?? t.exit_date ?? null,
    strategy: t.strategy ?? null,
    noteCount: t.noteCount ?? 0,
  }));

  const dashboardData: DashboardData = {
    dayPnL,
    portfolioValue: totalPortfolioValue,
    trades: transformedTrades,
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