"use client"

import type * as React from "react"
import { Home, LineChart, BarChart3, TrendingUp, FileText, Settings } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Demo User",
    email: "demo@example.com",
    avatar: "/avatars/demo.jpg",
  },
  teams: [
    {
      name: "Personal Trading",
      logo: Home,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Trading",
      url: "#",
      icon: LineChart,
      isActive: true,
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
        },
        {
          title: "Add Trade",
          url: "/dashboard/add-trade",
        },
        {
          title: "Trade History",
          url: "/dashboard/trade-history",
        },
        {
          title: "Import Trades",
          url: "/dashboard/import-trades",
        },
      ],
    },
    {
      title: "Analytics",
      url: "#",
      icon: BarChart3,
      items: [
        {
          title: "Calendar",
          url: "/dashboard/calendar",
        },
        {
          title: "Portfolio",
          url: "/dashboard/portfolio",
        },
        {
          title: "Risk Management",
          url: "/dashboard/risk-management",
        },
        {
          title: "Benchmark",
          url: "/dashboard/benchmark",
        },
        {
          title: "Analytics",
          url: "/dashboard/analytics",
        },
      ],
    },
    {
      title: "Market Data",
      url: "#",
      icon: TrendingUp,
      items: [
        {
          title: "Market Scanner",
          url: "/dashboard/market-scanner",
        },
        {
          title: "Price Alerts",
          url: "/dashboard/price-alerts",
        },
        {
          title: "Trending Tickers",
          url: "/dashboard/trending-tickers",
        },
      ],
    },
    {
      title: "Reports",
      url: "#",
      icon: FileText,
      items: [
        {
          title: "Reports",
          url: "/dashboard/reports",
        },
        {
          title: "Tax Center",
          url: "/dashboard/tax-center",
        },
      ],
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
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
