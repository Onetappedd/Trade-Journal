"use client"

import { useAuth } from "@/components/auth/enhanced-auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { EnhancedLoginForm } from "@/components/auth/enhanced-login-form"

export default function LoginPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <EnhancedLoginForm />
    </div>
  )
}
