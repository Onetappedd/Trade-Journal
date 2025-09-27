
import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase/server'

/**
 * Middleware to protect routes that require authentication
 * Redirects unauthenticated users to login with redirect parameter
 */
export async function middleware(request: NextRequest) {
  // E2E bypass - allow all requests in test mode
  if (process.env.NEXT_PUBLIC_E2E_TEST === 'true') {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl
  
  // Define protected routes
  const protectedRoutes = [
    '/dashboard',
    '/trades', 
    '/import',
    '/analytics',
    '/settings'
  ]
  
  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  if (!isProtectedRoute) {
    return NextResponse.next()
  }
  
  try {
    // Create Supabase client for server-side auth check
    const supabase = createSupabaseClient()
    
    // Get the session from cookies
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session?.user) {
      // User is not authenticated, redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      
      return NextResponse.redirect(loginUrl)
    }
    
    // User is authenticated, allow access
    return NextResponse.next()
    
  } catch (error) {
    console.error('Middleware auth check failed:', error)
    
    // On error, redirect to login to be safe
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/trades/:path*', 
    '/import/:path*',
    '/analytics/:path*',
    '/settings/:path*'
  ],
}
