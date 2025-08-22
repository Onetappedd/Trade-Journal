import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

// Force this API route to use Node.js runtime
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  let errorMsg = null;

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      },
    );

    try {
      // Exchange code for session
      await supabase.auth.exchangeCodeForSession(code);
      // Get user info
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        errorMsg = 'Could not fetch user profile after OAuth login.';
      } else {
        // Upsert user record in 'users' table (id, email, username, full_name)
        const { error: upsertError } = await supabase.from('users').upsert({
          id: user.id,
          email: user.email,
          username: (user.user_metadata as any)?.username || null,
          full_name:
            (user.user_metadata as any)?.full_name ||
            (user.user_metadata as any)?.name ||
            user.email,
        });
        if (upsertError) {
          errorMsg = 'Could not update user profile.';
        }
      }
    } catch (error) {
      console.error('Error during OAuth callback:', error);
      errorMsg = 'Authentication error. Please try again.';
    }
  } else {
    errorMsg = 'Missing OAuth code.';
  }

  if (errorMsg) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(errorMsg)}`,
    );
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
}
