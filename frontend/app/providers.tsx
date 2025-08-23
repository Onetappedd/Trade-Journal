'use client';
import { AuthProvider } from '@/lib/auth/AuthProvider'; // adjust import to your provider

export default function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
