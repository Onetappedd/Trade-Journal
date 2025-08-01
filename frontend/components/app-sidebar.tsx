"use client"

import {
  BarChart3,
  Home,
  Plus,
  Upload,
  History,
  TrendingUp,
  PieChart,
  Settings,
  Target,
  Calendar,
  FileText,
  Calculator,
  Bell,
  Search,
  Shield,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

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

const menuGroups = [
  {
    label: "Trading",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: Home,
      },
      {
        title: "Add Trade",
        url: "/add-trade",
        icon: Plus,
      },
      {
        title: "Import Trades",
        url: "/import-trades",
        icon: Upload,
      },
      {
        title: "Trade History",
        url: "/trade-history",
        icon: History,
      },
    ],
  },
  {
    label: "Portfolio",
    items: [
      {
        title: "Live Portfolio",
        url: "/portfolio",
        icon: TrendingUp,
      },
      {
        title: "Calendar",
        url: "/calendar",
        icon: Calendar,
      },
      {
        title: "Risk Management",
        url: "/risk-management",
        icon: Shield,
      },
    ],
  },
  {
    label: "Analytics & Reports",
    items: [
      {
        title: "Analytics",
        url: "/analytics",
        icon: BarChart3,
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
      {
        title: "Compare vs S&P",
        url: "/benchmark",
        icon: Target,
      },
    ],
  },
  {
    label: "Tools",
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
    ],
  },
  {
    label: "Settings",
    items: [
      {
        title: "Settings",
        url: "/settings",
        icon: Settings,
      },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <PieChart className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">TradeJournal Pro</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="text-xs text-muted-foreground">© 2024 TradeJournal Pro</div>
      </SidebarFooter>
    </Sidebar>
  )
}
