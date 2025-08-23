"use client";

import React from 'react';
// ⬇️ Adjust this import to your actual provider export
import { AuthProvider } from '@/context/auth';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
