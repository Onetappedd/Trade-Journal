import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Skip middleware for static files and API routes
  if (
    req.nextUrl.pathname.startsWith("/_next") ||
    req.nextUrl.pathname.startsWith("/api") ||
    req.nextUrl.pathname.includes(".")
  ) {
    return res
  }

  try {
    const supabase = createMiddlewareClient({ req, res })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If user is not signed in and trying to access protected routes
    if (!session && !req.nextUrl.pathname.startsWith("/login") && !req.nextUrl.pathname.startsWith("/auth")) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = "/login"
      redirectUrl.searchParams.set("redirectTo", req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If user is signed in and trying to access login page, redirect to dashboard
    if (session && req.nextUrl.pathname === "/login") {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = "/"
      return NextResponse.redirect(redirectUrl)
    }

    return res
  } catch (error) {
    // If there's an error with Supabase, allow the request to continue
    console.error("Middleware error:", error)
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
}
