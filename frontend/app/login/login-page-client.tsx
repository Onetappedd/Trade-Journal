"use client"

import { useAuth } from "@/components/auth/enhanced-auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { EnhancedLoginForm } from "@/components/auth/enhanced-login-form"
import { FinancialTicker } from "@/components/auth/financial-ticker"
import { BackgroundChartAnimation } from "@/components/auth/background-chart-animation"

export default function LoginPageClient() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <BackgroundChartAnimation />
      <FinancialTicker />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <EnhancedLoginForm />
        </div>
      </div>
    </div>
  )
}
