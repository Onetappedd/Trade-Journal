'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';

export function OAuthCallbackHandler() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Check if we're on the landing page with OAuth tokens in the hash
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash;
      
      // Check if this looks like an OAuth callback with tokens
      if (hash.includes('access_token=') || hash.includes('error=')) {
        // Clean up the URL hash
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // If we have a user, redirect to dashboard
        if (user && !loading) {
          router.push('/dashboard');
        }
      }
    }
  }, [user, loading, router]);

  // This component doesn't render anything
  return null;
}
