import { NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const userId = await getUserIdFromRequest({} as any)
    return NextResponse.json({
      ok: true,
      hasUser: Boolean(userId)
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}
