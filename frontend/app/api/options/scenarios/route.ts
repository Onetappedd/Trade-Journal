import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      symbol,
      type,
      strike,
      expiry,
      S,
      iv,
      r,
      q,
      method,
      multiplier,
      name
    } = body

    // Get user from session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Insert scenario
    const { data, error } = await supabase
      .from('option_scenarios')
      .insert({
        user_id: user.id,
        symbol: symbol || null,
        type,
        strike,
        expiry: expiry || null,
        S,
        iv,
        r,
        q,
        method,
        multiplier,
        name: name || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving scenario:', error)
      return NextResponse.json({ error: 'Failed to save scenario' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Scenario API error:', error)
    return NextResponse.json(
      { error: 'Failed to save scenario' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's scenarios
    const { data, error } = await supabase
      .from('option_scenarios')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching scenarios:', error)
      return NextResponse.json({ error: 'Failed to fetch scenarios' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Scenario API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scenarios' },
      { status: 500 }
    )
  }
}
