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

    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    // If no profile exists, return user data with empty profile fields
    if (!profile) {
      return NextResponse.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: '',
          lastName: '',
          username: '',
          bio: '',
          avatarUrl: null,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        avatarUrl: profile.avatar_url || null,
        createdAt: user.created_at,
        updatedAt: profile.updated_at || user.updated_at,
      }
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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
    const { firstName, lastName, username, bio, avatarUrl } = body

    // Validate required fields
    if (!firstName || !lastName || !username) {
      return NextResponse.json({ error: 'First name, last name, and username are required' }, { status: 400 })
    }

    // Check if username is already taken by another user
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to check username availability' }, { status: 500 })
    }

    if (existingProfile) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 400 })
    }

    // Upsert profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        username: username,
        bio: bio || null,
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile update error:', profileError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        username: profile.username,
        bio: profile.bio,
        avatarUrl: profile.avatar_url,
        updatedAt: profile.updated_at,
      }
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
