'use client';
// Force dynamic rendering for all dashboard pages
export const dynamic = 'force-dynamic';

import type React from 'react';
import { AppShell } from '@/components/layout/AppShell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
