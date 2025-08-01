import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    try {
      await supabase.auth.exchangeCodeForSession(code)
    } catch (error) {
      console.error("Auth callback error:", error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_callback_error`)
    }
  }

  // Redirect to dashboard or original destination
  const redirectTo = requestUrl.searchParams.get("redirectTo") || "/"
  return NextResponse.redirect(`${requestUrl.origin}${redirectTo}`)
}
