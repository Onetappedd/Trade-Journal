import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import type { Database } from "@/lib/database.types"

type Trade = Database['public']['Tables']['trades']['Row']
type TradeUpdate = Database['public']['Tables']['trades']['Update']

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: trade, error } = await supabase
      .from('trades')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error || !trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 })
    }

    return NextResponse.json(trade)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Prepare update data
    const updateData: TradeUpdate = {
      ...body,
      updated_at: new Date().toISOString(),
    }

    // Update status if exit_date is provided
    if (body.exit_date && !body.status) {
      updateData.status = "closed"
    }

    const { data: updatedTrade, error } = await supabase
      .from('trades')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error || !updatedTrade) {
      console.error('Error updating trade:', error)
      return NextResponse.json({ error: "Failed to update trade" }, { status: 500 })
    }

    return NextResponse.json(updatedTrade)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting trade:', error)
      return NextResponse.json({ error: "Failed to delete trade" }, { status: 500 })
    }

    return NextResponse.json({ message: "Trade deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
