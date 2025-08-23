'use client';

import React from 'react';

import { AuthProvider } from '@/context/auth';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
