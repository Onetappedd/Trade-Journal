"use client"

import type React from "react"
import { UnifiedHeader } from "@/components/unified-header"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { QueryProvider } from "@/components/query-provider"
import { Suspense } from "react"
import { usePathname } from "next/navigation"
import { Analytics } from "@vercel/analytics/next"

function ConditionalHeader() {
  const pathname = usePathname()

  if (pathname === "/") {
    return null
  }

  return <UnifiedHeader />
}

export default function ConditionalLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryProvider>
        <Suspense fallback={null}>
          <ConditionalHeader />
          {children}
        </Suspense>
        <Toaster />
        <SonnerToaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "rgb(30 41 59)",
              border: "1px solid rgb(51 65 85)",
              color: "rgb(226 232 240)",
            },
          }}
        />
      </QueryProvider>
      <Analytics />
    </ThemeProvider>
  )
}
