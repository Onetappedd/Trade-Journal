"use client"

import type * as React from "react"
import {
  BarChart3,
  Calendar,
  FileText,
  Home,
  Settings,
  TrendingUp,
  Target,
  Search,
  Bell,
  Calculator,
  Shield,
  Wallet,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Trading",
      items: [
        {
          title: "Dashboard",
          url: "/",
          icon: Home,
        },
        {
          title: "Trade History",
          url: "/trade-history",
          icon: FileText,
        },
        {
          title: "Add Trade",
          url: "/add-trade",
          icon: TrendingUp,
        },
        {
          title: "Import Trades",
          url: "/import-trades",
          icon: FileText,
        },
        {
          title: "Calendar",
          url: "/calendar",
          icon: Calendar,
        },
      ],
    },
    {
      title: "Portfolio",
      items: [
        {
          title: "Live Portfolio",
          url: "/portfolio",
          icon: Wallet,
        },
        {
          title: "Risk Management",
          url: "/risk-management",
          icon: Shield,
        },
      ],
    },
    {
      title: "Analytics & Reports",
      items: [
        {
          title: "Analytics",
          url: "/analytics",
          icon: BarChart3,
        },
        {
          title: "Benchmark",
          url: "/benchmark",
          icon: Target,
        },
        {
          title: "Reports",
          url: "/reports",
          icon: FileText,
        },
        {
          title: "Tax Center",
          url: "/tax-center",
          icon: Calculator,
        },
      ],
    },
    {
      title: "Tools",
      items: [
        {
          title: "Price Alerts",
          url: "/alerts",
          icon: Bell,
        },
        {
          title: "Market Scanner",
          url: "/scanner",
          icon: Search,
        },
        {
          title: "Trending Tickers",
          url: "/trending-tickers",
          icon: TrendingUp,
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          title: "Settings",
          url: "/settings",
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
        <div className="flex items-center gap-2 px-4 py-2">
          <TrendingUp className="h-6 w-6" />
          <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">Trading Journal</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {data.navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
