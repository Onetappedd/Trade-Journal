'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { checkUserAccess, UserRole } from '@/lib/subscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdminAccess() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const access = await checkUserAccess(user.id, 'admin');
        setIsAdmin(access.hasAccess);
      } catch (error) {
        console.error('Error checking admin access:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkAdminAccess();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--pp-accent]"></div>
      </div>
    );
  }

  if (!user) {
    return fallback || (
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to access admin features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="w-full">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return fallback || (
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-[--pp-danger]/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-[--pp-danger]" />
            </div>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>
              You don't have permission to access this admin area.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-[--pp-muted]">
              <Shield className="w-4 h-4 inline mr-1" />
              Admin features are restricted to authorized personnel only.
            </div>
            <Link href="/dashboard">
              <Button className="w-full">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
