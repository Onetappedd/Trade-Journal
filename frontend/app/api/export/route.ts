import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const scope = searchParams.get('scope') || 'today'

    // Calculate date range based on scope
    const now = new Date()
    let from: Date

    switch (scope) {
      case 'today':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'wtd':
        const day = (now.getDay() + 6) % 7
        from = new Date(now)
        from.setDate(now.getDate() - day)
        from.setHours(0, 0, 0, 0)
        break
      case 'mtd':
        from = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'ytd':
        from = new Date(now.getFullYear(), 0, 1)
        break
      default:
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    }

    // Fetch trades from database
    const { data: trades, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .gte('entry_date', from.toISOString())
      .order('entry_date', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 })
    }

    // Convert to CSV
    const headers = ['Date', 'Symbol', 'Side', 'Quantity', 'Price', 'PnL', 'Status']
    const csvRows = [headers.join(',')]

    trades?.forEach(trade => {
      const row = [
        trade.entry_date || '',
        trade.symbol || '',
        trade.side || '',
        trade.quantity || 0,
        trade.entry_price || 0,
        trade.pnl || 0,
        trade.status || 'closed'
      ]
      csvRows.push(row.map(field => `"${field}"`).join(','))
    })

    const csvContent = csvRows.join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="trades-${scope}-${now.toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error: any) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
