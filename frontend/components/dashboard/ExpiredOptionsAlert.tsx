'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth/auth-provider';

export function ExpiredOptionsAlert() {
  const [expiredCount, setExpiredCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    async function checkExpiredOptions() {
      if (!user) return;

      const supabase = createClient();
      const { count, error } = await supabase
        .from('trades')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('asset_type', 'option')
        .eq('status', 'expired')
        .eq('editable', true);

      if (!error && count && count > 0) {
        setExpiredCount(count);
        setIsVisible(true);
      }
      setIsLoading(false);
    }

    checkExpiredOptions();
  }, [user]);

  if (!isVisible || isLoading || expiredCount === 0) {
    return null;
  }

  return (
    <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-900 dark:text-orange-100">
        Expired Options Need Attention
      </AlertTitle>
      <AlertDescription className="text-orange-800 dark:text-orange-200">
        <div className="flex items-center justify-between">
          <span>
            You have {expiredCount} expired option{expiredCount > 1 ? 's' : ''} that need to be
            resolved. Please update the exit price and date for accurate P&L tracking.
          </span>
          <div className="flex items-center gap-2 ml-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push('/dashboard/trades')}
              className="gap-1"
            >
              View Trades
              <ArrowRight className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsVisible(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
