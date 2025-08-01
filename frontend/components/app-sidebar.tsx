"use client"

import * as React from "react"
import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  Settings2,
  BarChart3,
  TrendingUp,
  FileText,
  Briefcase,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"
import { useAuth } from "@/components/auth/enhanced-auth-provider"

// This is sample data.
const data = {
  user: {
    name: "Trading User",
    email: "user@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Trading Dashboard",
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
      title: "Trading",
      url: "#",
      icon: BarChart3,
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
      icon: Briefcase,
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
      icon: TrendingUp,
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
          title: "Performance Reports",
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
  const { user } = useAuth()

  // Create robust user data mapping with multiple fallback options
  const userData = React.useMemo(() => {
    if (!user) {
      return {
        name: "Guest User",
        email: "guest@example.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=guest",
      }
    }

    return {
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Trading User",
      email: user.email || "user@example.com",
      avatar:
        user.user_metadata?.avatar_url ||
        user.user_metadata?.picture ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || "default"}`,
    }
  }, [user])

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
