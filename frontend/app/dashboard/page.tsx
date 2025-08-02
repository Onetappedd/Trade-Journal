"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/enhanced-auth-provider"
import { DashboardContent } from "@/components/dashboard-content"
import { AppSidebar } from "@/components/app-sidebar"
import { Navbar } from "@/components/navbar"
import { SidebarProvider } from "@/components/ui/sidebar"

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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 p-6">
            <DashboardContent />
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
