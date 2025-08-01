"use client"

import type * as React from "react"
import {
  TrendingUp,
  BarChart3,
  PlusCircle,
  History,
  Upload,
  Calendar,
  Target,
  Shield,
  TrendingDown,
  FileText,
  Receipt,
  Search,
  Bell,
  Activity,
  Settings,
  GalleryVerticalEnd,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"

// Trading-focused navigation data
const data = {
  teams: [
    {
      name: "Trading Journal",
      logo: GalleryVerticalEnd,
      plan: "Pro",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: BarChart3,
      isActive: false,
      items: [],
    },
    {
      title: "Trading",
      url: "#",
      icon: TrendingUp,
      isActive: true,
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
          title: "Overview",
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
      title: "Analytics",
      url: "#",
      icon: BarChart3,
      items: [
        {
          title: "Performance",
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
      title: "Market Tools",
      url: "#",
      icon: Search,
      items: [
        {
          title: "Scanner",
          url: "/dashboard/scanner",
          icon: Search,
        },
        {
          title: "Market Scanner",
          url: "/dashboard/market-scanner",
          icon: Search,
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
      url: "/dashboard/settings",
      icon: Settings,
      items: [],
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
