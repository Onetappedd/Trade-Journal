
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Temporarily disable middleware to let client-side auth handle protection
  // This prevents the infinite redirect loop
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/analytics'],
}
