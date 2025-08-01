"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth/enhanced-auth-provider"
import { useToast } from "@/hooks/use-toast"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectTo") || "/"
  const { signIn, signUp, resetPassword } = useAuth()
  const { toast } = useToast()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Track and analyze your trading performance
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
