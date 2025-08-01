"use client"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Navbar } from "@/components/navbar"
import { DashboardContent } from "@/components/dashboard-content"

interface Trade {
  id: string
  symbol: string
  side: "buy" | "sell"
  quantity: number
  price: number
  pnl: number
  date: string
  status: "open" | "closed"
}

export default function DashboardPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Navbar />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <DashboardContent />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
