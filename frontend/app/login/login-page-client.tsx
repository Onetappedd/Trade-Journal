"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/enhanced-auth-provider"
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (user) {
    return null // Let the redirect happen
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <BackgroundChartAnimation />

      <div className="relative z-10 min-h-screen flex">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-white mb-6">Trade Journal Pro</h1>
            <p className="text-xl text-gray-300 mb-8">
              Track, analyze, and optimize your trading performance with advanced analytics and insights.
            </p>
            <FinancialTicker />
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <EnhancedLoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}
