import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import BackgroundChartAnimation from '@/components/auth/background-chart-animation';
import TickerTape from '@/components/auth/ticker-tape';
import LoginForm from '@/components/auth/login-form';

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
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
