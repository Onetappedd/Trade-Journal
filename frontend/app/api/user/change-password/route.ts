import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseWithToken } from '@/lib/supabase/server'
import { handleError, createSuccessResponse } from '@/lib/error-mapping'

export async function POST(request: NextRequest) {
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
    const { currentPassword, newPassword } = body

    // Validate input
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ 
        ok: false, 
        code: 'WEAK_PASSWORD', 
        message: 'Password must be at least 6 characters long' 
      }, { status: 400 })
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ ok: false, code: 'UNAUTHORIZED', message: 'Invalid or expired token' }, { status: 401 })
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (updateError) {
      const errorResponse = handleError(updateError)
      return NextResponse.json(errorResponse, { status: 400 })
    }

    return NextResponse.json(createSuccessResponse('Password updated successfully'))
  } catch (error) {
    const errorResponse = handleError(error)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
