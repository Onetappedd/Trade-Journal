"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/enhanced-auth-provider"
import { LoginForm } from "@/components/auth/login-form"
import { FinancialTicker } from "@/components/auth/financial-ticker"
import { BackgroundChartAnimation } from "@/components/auth/background-chart-animation"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Shield, BarChart3 } from "lucide-react"

export default function LoginPageClient() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (!loading && user) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  // Don't render login form if user is authenticated
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-primary rounded-lg p-2">
                <TrendingUp className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-3xl font-bold">Trading Journal</h1>
            <p className="text-muted-foreground mt-2">Professional trading analytics and performance tracking</p>
          </div>
          <LoginForm />
        </div>
      </div>

      {/* Right side - Marketing/Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        <BackgroundChartAnimation />

        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold mb-4">Track Your Trading Performance</h2>
              <p className="text-xl text-slate-300 leading-relaxed">
                Comprehensive analytics, risk management, and performance insights to help you become a better trader.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-white/10 rounded-lg p-2">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Advanced Analytics</h3>
                  <p className="text-slate-300">Detailed performance metrics and trading insights</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-white/10 rounded-lg p-2">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Risk Management</h3>
                  <p className="text-slate-300">Tools to help you manage and minimize trading risks</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-white/10 rounded-lg p-2">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Performance Tracking</h3>
                  <p className="text-slate-300">Monitor your progress and identify improvement areas</p>
                </div>
              </div>
            </div>

            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4">
                <FinancialTicker />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
