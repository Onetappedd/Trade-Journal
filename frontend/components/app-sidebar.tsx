"use client"

import type * as React from "react"
import {
  AudioWaveform,
  Bot,
  Command,
  GalleryVerticalEnd,
  Settings2,
  TrendingUp,
  BarChart3,
  Calendar,
  FileText,
  Target,
  Activity,
  Search,
  Bell,
  Briefcase,
  LineChart,
  Calculator,
  Shield,
  Download,
  Upload,
  History,
  Plus,
  Home,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
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
      plan: "Startup",
    },
    {
      name: "Risk Analytics",
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
      icon: TrendingUp,
      items: [
        {
          title: "Add Trade",
          url: "/dashboard/add-trade",
          icon: Plus,
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
          title: "Performance",
          url: "/dashboard/analytics",
          icon: LineChart,
        },
        {
          title: "Risk Management",
          url: "/dashboard/risk-management",
          icon: Shield,
        },
        {
          title: "Benchmark",
          url: "/dashboard/benchmark",
          icon: Target,
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
          url: "/dashboard/scanner",
          icon: Search,
        },
        {
          title: "Price Alerts",
          url: "/dashboard/alerts",
          icon: Bell,
        },
        {
          title: "Trending Tickers",
          url: "/dashboard/trending-tickers",
          icon: Activity,
        },
        {
          title: "Calendar",
          url: "/dashboard/calendar",
          icon: Calendar,
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
        {
          title: "Export Data",
          url: "/dashboard/export",
          icon: Download,
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
