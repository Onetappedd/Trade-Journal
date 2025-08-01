"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/enhanced-auth-provider"
import LoginForm from "@/components/auth/login-form"
import { BackgroundChartAnimation } from "@/components/auth/background-chart-animation"
import { FinancialTicker } from "@/components/auth/financial-ticker"
import { TerminalCaret } from "@/components/auth/terminal-caret"

export default function LoginPageClient() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Effects */}
      <BackgroundChartAnimation />
      <TerminalCaret />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 pb-16">
        <LoginForm />
      </div>

      {/* Financial Ticker */}
      <FinancialTicker />
    </div>
  )
}
