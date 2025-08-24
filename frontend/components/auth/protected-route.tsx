'use client';

import type React from 'react';

import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, supabase } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we have a supabase client (auth is initialized) and no user
    if (supabase && !user) {
      router.push('/login');
    }
  }, [user, supabase, router]);

  // Show loading if auth is not initialized yet (supabase is null)
  if (!supabase) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Show loading if no user (auth is initialized but user is not authenticated)
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return <>{children}</>;
}
