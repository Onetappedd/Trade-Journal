"use client"

import type * as React from "react"
import {
  Home,
  TrendingUp,
  BarChart3,
  Calendar,
  Settings,
  PlusCircle,
  History,
  Upload,
  Target,
  Briefcase,
  AlertTriangle,
  FileText,
  Calculator,
  Search,
  Bell,
  Eye,
} from "lucide-react"

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
    {
      name: "Team Account",
      logo: Briefcase,
      plan: "Pro",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      isActive: true,
    },
    {
      title: "Trading",
      url: "#",
      icon: TrendingUp,
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
      ],
    },
    {
      title: "Analytics",
      url: "#",
      icon: BarChart3,
      items: [
        {
          title: "Portfolio",
          url: "/dashboard/portfolio",
          icon: Briefcase,
        },
        {
          title: "Risk Management",
          url: "/dashboard/risk-management",
          icon: AlertTriangle,
        },
        {
          title: "Benchmark",
          url: "/dashboard/benchmark",
          icon: Target,
        },
        {
          title: "Analytics",
          url: "/dashboard/analytics",
          icon: BarChart3,
        },
      ],
    },
    {
      title: "Market Tools",
      url: "#",
      icon: Search,
      items: [
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
          icon: Eye,
        },
      ],
    },
    {
      title: "Reports",
      url: "#",
      icon: FileText,
      items: [
        {
          title: "Performance Reports",
          url: "/dashboard/reports",
          icon: FileText,
        },
        {
          title: "Tax Center",
          url: "/dashboard/tax-center",
          icon: Calculator,
        },
      ],
    },
    {
      title: "Calendar",
      url: "/dashboard/calendar",
      icon: Calendar,
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
