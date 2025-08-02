"use client"

import { Home, TrendingUp, Calendar, Settings, BarChart3, AlertTriangle, FileText, Calculator } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { TeamSwitcher } from "@/components/team-switcher"
import { NavUser } from "@/components/nav-user"

const navigation = [
  {
    title: "Trading",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: Home },
      { title: "Trade History", url: "/dashboard/trades", icon: TrendingUp },
      { title: "Portfolio", url: "/dashboard/portfolio", icon: BarChart3 },
      { title: "Calendar", url: "/dashboard/calendar", icon: Calendar },
    ],
  },
  {
    title: "Analysis",
    items: [
      { title: "Reports", url: "/dashboard/reports", icon: FileText },
      { title: "Risk Management", url: "/dashboard/risk", icon: AlertTriangle },
      { title: "Tax Center", url: "/dashboard/tax", icon: Calculator },
    ],
  },
  {
    title: "Settings",
    items: [{ title: "Preferences", url: "/dashboard/settings", icon: Settings }],
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {navigation.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon className="h-4 w-4" />
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
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
