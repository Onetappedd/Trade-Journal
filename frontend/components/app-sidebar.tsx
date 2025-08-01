"use client"

import type React from "react"

import { Home, LineChart, Calendar, Settings, TrendingUp, AlertCircle, FileText, Calculator } from "lucide-react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"
import { TeamSwitcher } from "@/components/team-switcher"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"

const data = {
  teams: [
    {
      name: "Trading Account",
      logo: TrendingUp,
      plan: "Pro",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Trade History",
      url: "/dashboard/trade-history",
      icon: LineChart,
    },
    {
      title: "Calendar",
      url: "/dashboard/calendar",
      icon: Calendar,
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: TrendingUp,
    },
    {
      title: "Alerts",
      url: "/dashboard/alerts",
      icon: AlertCircle,
    },
    {
      title: "Reports",
      url: "/dashboard/reports",
      icon: FileText,
    },
    {
      title: "Tax Center",
      url: "/dashboard/tax-center",
      icon: Calculator,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
