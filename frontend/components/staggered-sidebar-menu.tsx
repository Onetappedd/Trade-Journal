"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  BarChart3,
  TrendingUp,
  History,
  FileText,
  CalendarIcon,
  Upload,
  Trophy,
  CreditCard,
  Settings,
} from "lucide-react"

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3, description: "Portfolio overview" },
  { href: "/analytics", label: "Analytics", icon: TrendingUp, description: "Deep insights" },
  { href: "/trades", label: "Trade History", icon: History, description: "View all trades" },
  { href: "/journal", label: "Journal", icon: FileText, description: "Trading notes & insights" },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon, description: "Daily P&L visualization" },
  { href: "/import", label: "Import Trades", icon: Upload, description: "Import & connect brokers" },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy, description: "Trader rankings" },
  { href: "/subscriptions", label: "Subscriptions", icon: CreditCard, description: "Billing & plans" },
  { href: "/settings", label: "Settings", icon: Settings, description: "Account settings" },
]

interface StaggeredSidebarMenuProps {
  className?: string
}

export function StaggeredSidebarMenu({ className }: StaggeredSidebarMenuProps) {
  const [isHovered, setIsHovered] = useState(false)
  const pathname = usePathname()

  return (
    <div 
      className={cn("relative", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Menu Items */}
      <div className="space-y-1">
        {menuItems.map((item, index) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-out",
                "hover:bg-slate-800/50 hover:text-white hover:translate-x-1",
                isActive
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 shadow-lg shadow-emerald-600/10"
                  : "text-slate-300",
                isHovered && "animate-in slide-in-from-left-2 fade-in-0",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              )}
              style={{
                animationDelay: isHovered ? `${index * 75}ms` : "0ms",
                animationFillMode: "both",
              }}
            >
              {/* Icon */}
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md transition-all duration-300",
                  "group-hover:scale-110 group-hover:rotate-3",
                  isActive
                    ? "bg-emerald-600/20 text-emerald-400 shadow-md shadow-emerald-600/20"
                    : "bg-slate-800/50 text-slate-400 group-hover:bg-slate-700/50 group-hover:text-slate-300 group-hover:shadow-md"
                )}
              >
                <Icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              </div>

              {/* Label and Description */}
              <div className="flex-1 min-w-0">
                <div className="truncate font-medium transition-colors duration-300">
                  {item.label}
                </div>
                <div
                  className={cn(
                    "truncate text-xs transition-all duration-300",
                    isActive
                      ? "text-emerald-300/80"
                      : "text-slate-500 group-hover:text-slate-400"
                  )}
                >
                  {item.description}
                </div>
              </div>

              {/* Active Indicator */}
              {isActive && (
                <div className="absolute right-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
              )}

              {/* Hover Glow Effect */}
              <div
                className={cn(
                  "absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-500/5 via-emerald-500/10 to-transparent opacity-0 transition-all duration-300",
                  "group-hover:opacity-100 group-hover:shadow-lg group-hover:shadow-emerald-500/10"
                )}
              />

              {/* Staggered Animation Overlay */}
              {isHovered && (
                <div
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-slate-800/20 to-transparent animate-in fade-in-0"
                  style={{
                    animationDelay: `${index * 75}ms`,
                    animationDuration: "300ms",
                  }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
