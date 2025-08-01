"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth/enhanced-auth-provider"
import { useToast } from "@/hooks/use-toast"
import LoginForm from "@/components/auth/login-form"

export default function LoginPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectTo") || "/dashboard"
  const { user, loading } = useAuth()
  const { toast } = useToast()

  // Redirect if already logged in
  if (!loading && user) {
    router.push(redirectTo)
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trading Journal</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Track and analyze your trading performance</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
