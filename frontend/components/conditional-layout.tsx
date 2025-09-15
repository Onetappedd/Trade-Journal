"use client"

import type React from "react"
import { SidebarLayout } from "@/components/sidebar-layout"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { Suspense } from "react"
import { usePathname } from "next/navigation"

function ConditionalLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()

  return (
    <Suspense fallback={null}>
      {/* Don't show sidebar on home page or auth pages */}
      {pathname === "/" || pathname.startsWith("/auth") || pathname.startsWith("/login") ? (
        <main className="min-h-screen bg-slate-950 text-slate-100">
          {children}
        </main>
      ) : (
        <SidebarLayout>{children}</SidebarLayout>
      )}
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
    </Suspense>
  )
}

export default ConditionalLayout
