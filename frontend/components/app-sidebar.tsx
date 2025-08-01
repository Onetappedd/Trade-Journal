"use client"

import type * as React from "react"
import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  PieChart,
  Settings2,
  TrendingUp,
  BarChart3,
  FileText,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"

// This is sample data for the trading dashboard
const data = {
  user: {
    name: "Trading Pro",
    email: "trader@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Personal Trading",
      logo: GalleryVerticalEnd,
      plan: "Pro",
    },
    {
      name: "Hedge Fund",
      logo: AudioWaveform,
      plan: "Enterprise",
    },
    {
      name: "Day Trading",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Trading",
      url: "#",
      icon: TrendingUp,
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
      title: "Portfolio",
      url: "#",
      icon: PieChart,
      items: [
        {
          title: "Overview",
          url: "/dashboard/portfolio",
        },
        {
          title: "Calendar",
          url: "/dashboard/calendar",
        },
        {
          title: "Risk Management",
          url: "/dashboard/risk-management",
        },
        {
          title: "Benchmark",
          url: "/dashboard/benchmark",
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
        },
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
          title: "Monthly Reports",
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
