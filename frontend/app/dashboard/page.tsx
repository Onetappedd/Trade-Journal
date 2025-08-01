"use client"

import { useAuth } from "@/components/auth/enhanced-auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { DashboardContent } from "@/components/dashboard-content"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { Navbar } from "@/components/navbar"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Navbar title="Dashboard" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <DashboardContent />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
