
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Check for auth cookie instead of using Supabase in Edge runtime
  const authCookie = request.cookies.get('sb-access-token') || 
                    request.cookies.get('sb-refresh-token') ||
                    request.cookies.get('supabase-auth-token')

  // if user is not signed in and the current path is not /login, redirect the user to /login
  if (!authCookie && request.nextUrl.pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/analytics'],
}
