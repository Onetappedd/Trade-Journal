"use client"
import { useState } from "react"
import { QueryClient, QueryClientProvider, HydrationBoundary } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth/auth-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
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
