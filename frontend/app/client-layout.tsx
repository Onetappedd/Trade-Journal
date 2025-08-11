"use client"
import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth/auth-provider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Ensure QueryClient is only created once per app lifecycle
  const [queryClient] = useState(() => new QueryClient())
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              {children}
            </ThemeProvider>
          </QueryClientProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
