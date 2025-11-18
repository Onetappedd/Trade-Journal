/**
 * Route Guards for Debug and Test API Routes
 * 
 * These utilities protect debug/test routes from being accessed in production
 * unless explicitly enabled via environment variable.
 */

import { NextResponse } from 'next/server';

/**
 * Checks if debug routes are allowed in the current environment
 * @returns true if debug routes are allowed, false otherwise
 */
export function isDebugRouteAllowed(): boolean {
  // Allow in development
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }
  
  // Allow in production only if explicitly enabled
  return process.env.ENABLE_DEBUG_ROUTES === 'true';
}

/**
 * Route guard for debug/test endpoints
 * Returns a 404 response if debug routes are not allowed
 * @returns NextResponse with 404 error, or null if route is allowed
 */
export function debugRouteGuard(): NextResponse | null {
  if (!isDebugRouteAllowed()) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }
  return null;
}

/**
 * Higher-order function to wrap API route handlers with debug guard
 * @param handler The API route handler function
 * @returns Wrapped handler that checks debug access first
 */
export function withDebugGuard<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    const guardResponse = debugRouteGuard();
    if (guardResponse) {
      return guardResponse;
    }
    return handler(...args);
  }) as T;
}

