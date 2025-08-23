"use client";

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/context/auth';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const [qc] = React.useState(() => new QueryClient());
  return (
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={qc}>
          {children}
        </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
