"use client"
import { QueryClient, QueryClientProvider, HydrationBoundary } from "@tanstack/react-query"
import React, { useEffect, useState } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth/auth-provider"
import { invalidateInstrumentsCache } from "@/lib/market/instruments"
// Dynamic import to avoid SSR issues
const supabaseClient = typeof window !== 'undefined' && (await import("@supabase/supabase-js")).createClient

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  useEffect(() => {
    if (typeof window === 'undefined' || !supabaseClient) return;
    (async () => {
      // Connect to Supabase Realtime for instruments
      const supabase = supabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      supabase.channel('instruments')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'instruments' }, () => {
          invalidateInstrumentsCache()
        })
        .subscribe()
    })()
  }, [])
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </HydrationBoundary>
      </QueryClientProvider>
    </AuthProvider>
  )
}
