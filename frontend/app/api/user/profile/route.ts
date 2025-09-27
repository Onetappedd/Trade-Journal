import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseWithToken } from '@/lib/supabase/server'
import { handleError, createSuccessResponse } from '@/lib/error-mapping'

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ ok: false, code: 'UNAUTHORIZED', message: 'No authorization token provided' }, { status: 401 })
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
      return NextResponse.json({ ok: false, code: 'UNAUTHORIZED', message: 'Invalid or expired token' }, { status: 401 })
    }

    // Update user metadata in auth.users
    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: {
        full_name: `${first_name} ${last_name}`,
        first_name,
        last_name,
        username,
        bio,
      }
    })

    if (authUpdateError) {
      const errorResponse = handleError(authUpdateError)
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // Update profile in public.profiles table
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        display_name: `${first_name} ${last_name}`,
        username,
        bio,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (profileUpdateError) {
      const errorResponse = handleError(profileUpdateError)
      return NextResponse.json(errorResponse, { status: 400 })
    }

    return NextResponse.json(createSuccessResponse('Profile updated successfully'))
  } catch (error) {
    const errorResponse = handleError(error)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
