"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "./enhanced-auth-provider"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading) {
      const isAuthPage = pathname === "/login" || pathname === "/auth/reset-password"
      const isProtectedRoute = pathname.startsWith("/dashboard") || pathname === "/"

      if (!user && isProtectedRoute) {
        // Redirect unauthenticated users to login
        router.push("/login")
      } else if (user && isAuthPage) {
        // Redirect authenticated users away from auth pages
        router.push("/dashboard")
      }
    }
  }, [user, loading, pathname, router])

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show login page for unauthenticated users on protected routes
  if (!user && (pathname.startsWith("/dashboard") || pathname === "/")) {
    return null // Let the redirect happen
  }

  // Show dashboard for authenticated users on auth pages
  if (user && (pathname === "/login" || pathname === "/auth/reset-password")) {
    return null // Let the redirect happen
  }

  return <>{children}</>
}
