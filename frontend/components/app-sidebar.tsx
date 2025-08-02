"use client"

import type * as React from "react"
import { AudioWaveform, BookOpen, Bot, Command, GalleryVerticalEnd, PieChart, Settings2, Home } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "Demo User",
    email: "demo@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Trading Journal",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Portfolio Analytics",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Risk Management",
      logo: Command,
      plan: "Free",
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
      icon: BookOpen,
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
      title: "Analytics",
      url: "#",
      icon: PieChart,
      items: [
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
          title: "Reports",
          url: "/dashboard/reports",
        },
      ],
    },
    {
      title: "Market Data",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Scanner",
          url: "/dashboard/scanner",
        },
        {
          title: "Trending Tickers",
          url: "/dashboard/trending-tickers",
        },
        {
          title: "Price Alerts",
          url: "/dashboard/price-alerts",
        },
      ],
    },
    {
      title: "Tools",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Calendar",
          url: "/dashboard/calendar",
        },
        {
          title: "Tax Center",
          url: "/dashboard/tax-center",
        },
        {
          title: "Settings",
          url: "/dashboard/settings",
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
