"use client"

import { useAuth } from "@/components/auth/enhanced-auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { DashboardContent } from "@/components/dashboard-content"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return <DashboardContent />
}
