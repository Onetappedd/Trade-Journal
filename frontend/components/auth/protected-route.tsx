"use client"

import type React from "react"

import { useAuth } from "./enhanced-auth-provider"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user && !pathname.startsWith("/login") && !pathname.startsWith("/auth")) {
      router.push("/login")
    }
  }, [user, loading, router, pathname])

  // Show loading or redirect for auth pages
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Allow access to login and auth pages without authentication
  if (!user && (pathname.startsWith("/login") || pathname.startsWith("/auth"))) {
    return <>{children}</>
  }

  // Require authentication for all other pages
  if (!user) {
    return null
  }

  return <>{children}</>
}
