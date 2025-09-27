/**
 * Server-only authentication utility
 * 
 * This file provides server-side authentication functions that read
 * the session from cookies and return user data or throw errors.
 * 
 * Only use this in server-side code (API routes, server components, etc.)
 */

import { createSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Gets the current user from the session or throws a 401 error
 * Use this in API routes when you need to ensure authentication
 * 
 * @returns The authenticated user
 * @throws {Response} 401 response if not authenticated
 */
export async function getUserOrThrow(): Promise<{
  id: string
  email?: string
  user_metadata?: any
  app_metadata?: any
}> {
  try {
    const supabase = createSupabaseClient()
    
    // Get the session from cookies
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Session error:', error)
      throw new Response('Authentication failed', { status: 401 })
    }
    
    if (!session?.user) {
      throw new Response('Unauthorized', { status: 401 })
    }
    
    return session.user
    
  } catch (error) {
    if (error instanceof Response) {
      throw error
    }
    
    console.error('getUserOrThrow error:', error)
    throw new Response('Internal server error', { status: 500 })
  }
}

/**
 * Gets the current user from the session or redirects to login
 * Use this in server components when you need to ensure authentication
 * 
 * @param redirectTo - Optional path to redirect to after login
 * @returns The authenticated user
 * @throws {never} - Always redirects instead of throwing
 */
export async function getUserOrRedirect(redirectTo?: string): Promise<{
  id: string
  email?: string
  user_metadata?: any
  app_metadata?: any
}> {
  try {
    const supabase = createSupabaseClient()
    
    // Get the session from cookies
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session?.user) {
      const loginUrl = new URL('/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
      if (redirectTo) {
        loginUrl.searchParams.set('redirectTo', redirectTo)
      }
      redirect(loginUrl.toString())
    }
    
    return session.user
    
  } catch (error) {
    console.error('getUserOrRedirect error:', error)
    redirect('/login')
  }
}

/**
 * Gets the current user from the session or returns null
 * Use this when you want to handle the unauthenticated case gracefully
 * 
 * @returns The authenticated user or null
 */
export async function getUserOrNull(): Promise<{
  id: string
  email?: string
  user_metadata?: any
  app_metadata?: any
} | null> {
  try {
    const supabase = createSupabaseClient()
    
    // Get the session from cookies
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session?.user) {
      return null
    }
    
    return session.user
    
  } catch (error) {
    console.error('getUserOrNull error:', error)
    return null
  }
}

/**
 * Gets the current user's ID or throws a 401 error
 * Convenience function for when you only need the user ID
 * 
 * @returns The authenticated user's ID
 * @throws {Response} 401 response if not authenticated
 */
export async function getUserIdOrThrow(): Promise<string> {
  const user = await getUserOrThrow()
  return user.id
}
