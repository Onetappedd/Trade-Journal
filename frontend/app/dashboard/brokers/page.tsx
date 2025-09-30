import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import BrokerConnection from '@/components/snaptrade/BrokerConnection';

export default async function BrokersPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/login');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Broker Connections</h1>
          <p className="text-gray-600 mt-2">
            Connect your broker accounts to automatically sync your trading data and get verified status.
          </p>
        </div>

        <BrokerConnection userId={user.id} />
      </div>
    </div>
  );
}
