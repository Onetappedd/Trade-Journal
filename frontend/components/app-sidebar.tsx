"use client"

import type * as React from "react"
import {
  AudioWaveform,
  Bot,
  Command,
  GalleryVerticalEnd,
  PieChart,
  Settings2,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  FileText,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "Trading Pro",
    email: "trader@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Trading Journal",
      logo: GalleryVerticalEnd,
      plan: "Pro",
    },
    {
      name: "Portfolio Manager",
      logo: AudioWaveform,
      plan: "Free",
    },
    {
      name: "Risk Analytics",
      logo: Command,
      plan: "Premium",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: BarChart3,
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
      title: "Analysis",
      url: "#",
      icon: PieChart,
      items: [
        {
          title: "Portfolio",
          url: "/dashboard/portfolio",
        },
        {
          title: "Analytics",
          url: "/dashboard/analytics",
        },
        {
          title: "Calendar",
          url: "/dashboard/calendar",
        },
      ],
    },
    {
      title: "Tools",
      url: "#",
      icon: Bot,
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
      title: "Risk Management",
      url: "/dashboard/risk-management",
      icon: AlertTriangle,
    },
    {
      title: "Reports",
      url: "#",
      icon: FileText,
      items: [
        {
          title: "Performance",
          url: "/dashboard/reports",
        },
        {
          title: "Tax Center",
          url: "/dashboard/tax-center",
        },
        {
          title: "Benchmark",
          url: "/dashboard/benchmark",
        },
      ],
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings2,
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
