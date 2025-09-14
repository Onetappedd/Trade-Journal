import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    const body = await request.json()
    const { first_name, last_name, username, bio } = body

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        full_name: `${first_name} ${last_name}`,
        first_name,
        last_name,
        username,
        bio,
      }
    })

    if (updateError) {
      console.error('Error updating user profile:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Profile updated successfully' })
  } catch (error) {
    console.error('Error in profile update:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
