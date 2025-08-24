'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/auth-provider';

export function useExpiredOptions() {
  const [isChecking, setIsChecking] = useState(false);
  const [expiredCount, setExpiredCount] = useState(0);
  const { user } = useAuth();

  const checkAndUpdateExpiredOptions = async () => {
    if (!user) return;

    setIsChecking(true);
    try {
      const response = await fetch('/api/update-expired-options', {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();

        if (result.tradesUpdated > 0) {
          setExpiredCount(result.tradesUpdated);
          toast.error('Expired Options Detected', {
            description: `${result.tradesUpdated} option${result.tradesUpdated > 1 ? 's' : ''} have expired and need your attention.`,
            duration: 10000, // Show for 10 seconds
          });
        }

        return result;
      }
    } catch (error) {
      console.error('Failed to check expired options:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // Check on mount
  useEffect(() => {
    checkAndUpdateExpiredOptions();
  }, [user]);

  return {
    isChecking,
    expiredCount,
    checkAndUpdateExpiredOptions,
  };
}
