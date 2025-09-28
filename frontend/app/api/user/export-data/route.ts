import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseWithToken } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const supabase = createSupabaseWithToken(request)

    const body = await request.json()
    const { exportType } = body

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let data = null

    if (exportType === 'trades') {
      // Export trades data
      const { data: trades, error: tradesError } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)

      if (tradesError) {
        console.error('Error fetching trades:', tradesError)
        return NextResponse.json({ error: 'Failed to fetch trades data' }, { status: 500 })
      }

      data = trades
    } else if (exportType === 'account data') {
      // Export account data
      const { data: executions, error: executionsError } = await supabase
        .from('executions_normalized')
        .select('*')
        .eq('user_id', user.id)

      if (executionsError) {
        console.error('Error fetching executions:', executionsError)
        return NextResponse.json({ error: 'Failed to fetch account data' }, { status: 500 })
      }

      data = executions
    }

    // In a real implementation, you would:
    // 1. Generate a CSV/JSON file
    // 2. Store it temporarily
    // 3. Send an email with download link
    // 4. Clean up after download

    // For now, we'll just return the data
    return NextResponse.json({ 
      message: 'Export completed successfully',
      data: data,
      exportType: exportType,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in data export:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
