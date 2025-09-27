import { redirect } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
import BackgroundChartAnimation from '@/components/auth/background-chart-animation';
import TickerTape from '@/components/auth/ticker-tape';
import LoginForm from '@/components/auth/login-form';

interface LoginPageProps {
  searchParams: {
    redirectTo?: string;
  };
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Redirect to the intended destination or dashboard
    const redirectTo = searchParams.redirectTo || '/dashboard';
    redirect(redirectTo);
  }

  return (
    <div className="min-h-screen relative overflow-hidden pb-12">
      {/* Animated candlestick background */}
      <BackgroundChartAnimation />

      {/* Login form */}
      <div className="relative z-20 flex items-center justify-center min-h-screen p-4">
        <LoginForm />
      </div>

      {/* Bottom ticker tape */}
      <TickerTape />
    </div>
  );
}
