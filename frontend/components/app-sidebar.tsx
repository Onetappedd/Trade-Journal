"use client"

import type * as React from "react"
import {
  BarChart3,
  Settings,
  TrendingUp,
  Target,
  Search,
  PlusCircle,
  History,
  Upload,
  Calendar,
  Shield,
  TrendingDown,
  FileText,
  Receipt,
  Radar,
  Bell,
  Activity,
  Home,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"

// Updated navigation structure without emojis
const data = {
  user: {
    name: "Trading User",
    email: "user@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Trading Dashboard",
      logo: TrendingUp,
      plan: "Pro",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      isActive: false,
      items: [],
    },
    {
      title: "Trading",
      url: "#",
      icon: TrendingUp,
      isActive: false,
      items: [
        {
          title: "Add Trade",
          url: "/dashboard/add-trade",
          icon: PlusCircle,
        },
        {
          title: "Trade History",
          url: "/dashboard/trade-history",
          icon: History,
        },
        {
          title: "Import Trades",
          url: "/dashboard/import-trades",
          icon: Upload,
        },
        {
          title: "Calendar",
          url: "/dashboard/calendar",
          icon: Calendar,
        },
      ],
    },
    {
      title: "Portfolio",
      url: "#",
      icon: Target,
      items: [
        {
          title: "Live Portfolio",
          url: "/dashboard/portfolio",
          icon: Target,
        },
        {
          title: "Risk Management",
          url: "/dashboard/risk-management",
          icon: Shield,
        },
        {
          title: "Benchmark",
          url: "/dashboard/benchmark",
          icon: TrendingDown,
        },
      ],
    },
    {
      title: "Analytics & Reports",
      url: "#",
      icon: BarChart3,
      items: [
        {
          title: "Analytics",
          url: "/dashboard/analytics",
          icon: BarChart3,
        },
        {
          title: "Reports",
          url: "/dashboard/reports",
          icon: FileText,
        },
        {
          title: "Tax Center",
          url: "/dashboard/tax-center",
          icon: Receipt,
        },
      ],
    },
    {
      title: "Tools",
      url: "#",
      icon: Search,
      items: [
        {
          title: "Market Scanner",
          url: "/dashboard/market-scanner",
          icon: Radar,
        },
        {
          title: "Price Alerts",
          url: "/dashboard/price-alerts",
          icon: Bell,
        },
        {
          title: "Trending Tickers",
          url: "/dashboard/trending-tickers",
          icon: Activity,
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings,
      items: [
        {
          title: "Account Settings",
          url: "/dashboard/settings",
          icon: Settings,
        },
      ],
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
