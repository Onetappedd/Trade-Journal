import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import type { Database } from "@/lib/database.types"

// Force this API route to use Node.js runtime
export const runtime = 'nodejs'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching profile:', error)
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
    }

    // If no profile exists, return a default structure
    if (!profile) {
      return NextResponse.json({
        id: null,
        user_id: user.id,
        full_name: user.user_metadata?.name || user.email?.split('@')[0] || '',
        avatar_url: null,
        website: null,
        updated_at: null,
        created_at: new Date().toISOString(),
      })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profileData: ProfileInsert = {
      id: user.id,
      full_name: body.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
      avatar_url: body.avatar_url || null,
      website: body.website || null,
    }

    // Use upsert to handle both create and update (PK is id)
    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' })
      .select()
      .single()

    if (error) {
      console.error('Error creating/updating profile:', error)
      return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
    }

    return NextResponse.json(profile, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }
}
