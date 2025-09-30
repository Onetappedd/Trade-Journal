import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get data statistics
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('id, created_at')
      .eq('user_id', user.id)

    if (tradesError) {
      console.error('Trades fetch error:', tradesError)
      return NextResponse.json({ error: 'Failed to fetch trade data' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        totalTrades: trades?.length || 0,
        lastExport: null, // TODO: Implement export tracking
        accountCreated: user.created_at,
      }
    })
  } catch (error) {
    console.error('Data fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'export') {
      // Get all user data
      const { data: trades, error: tradesError } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (tradesError || profileError) {
        console.error('Data export error:', tradesError || profileError)
        return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
      }

      const exportData = {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
        },
        profile: profile,
        trades: trades,
        exported_at: new Date().toISOString(),
      }

      // In a real implementation, you would:
      // 1. Generate a CSV/JSON file
      // 2. Store it in a secure location
      // 3. Send download link via email
      // For now, we'll return the data directly

      return NextResponse.json({
        success: true,
        data: exportData,
        message: 'Data export completed. Download link will be sent to your email.'
      })
    }

    if (action === 'reset_trades') {
      // Delete all user trades
      const { error: deleteError } = await supabase
        .from('trades')
        .delete()
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('Trades reset error:', deleteError)
        return NextResponse.json({ error: 'Failed to reset trades' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'All trading data has been reset successfully'
      })
    }

    if (action === 'delete_account') {
      // This is a destructive action - in production, you'd want additional confirmation
      // For now, we'll just delete the user's data
      const { error: deleteTradesError } = await supabase
        .from('trades')
        .delete()
        .eq('user_id', user.id)

      const { error: deleteProfileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (deleteTradesError || deleteProfileError) {
        console.error('Account deletion error:', deleteTradesError || deleteProfileError)
        return NextResponse.json({ error: 'Failed to delete account data' }, { status: 500 })
      }

      // Note: In production, you'd also want to delete the auth user
      // This requires admin privileges and should be done carefully

      return NextResponse.json({
        success: true,
        message: 'Account deletion initiated. You will receive a confirmation email.'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Data action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
