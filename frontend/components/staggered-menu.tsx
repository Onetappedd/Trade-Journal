"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Home,
  BarChart3,
  TrendingUp,
  Settings,
  Menu,
  X,
  ChevronRight,
  History,
  Upload,
  Trophy,
  FileText,
  CreditCard,
  CalendarIcon,
} from "lucide-react"

const menuItems = [
  { href: "/", label: "Home", icon: Home, description: "Landing page" },
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

export function StaggeredMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Menu Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 bg-slate-800/80 backdrop-blur-sm border border-slate-700 hover:bg-slate-700 text-slate-200"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Staggered Menu */}
      <div
        className={`
        fixed top-0 right-0 h-full w-80 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 z-40
        transform transition-transform duration-500 ease-out
        ${isOpen ? "translate-x-0" : "translate-x-full"}
      `}
      >
        <div className="p-6 pt-16">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Navigation</h2>
            <p className="text-slate-400 text-sm">Access all your trading tools</p>
          </div>

          {/* Menu Items */}
          <nav className="space-y-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    group flex items-center p-4 rounded-lg transition-all duration-300 ease-out
                    hover:bg-slate-800 hover:translate-x-2 border border-transparent
                    ${isActive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "text-slate-300"}
                    ${isOpen ? "animate-in slide-in-from-right-5" : ""}
                  `}
                  style={{
                    animationDelay: isOpen ? `${index * 100}ms` : "0ms",
                    animationFillMode: "both",
                  }}
                >
                  <div
                    className={`
                    p-2 rounded-md mr-4 transition-colors duration-200
                    ${isActive ? "bg-emerald-500/20" : "bg-slate-800 group-hover:bg-slate-700"}
                  `}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-slate-500 group-hover:text-slate-400">{item.description}</div>
                  </div>

                  <ChevronRight
                    className={`
                    h-4 w-4 transition-transform duration-200 opacity-0 group-hover:opacity-100
                    ${isActive ? "text-emerald-400" : "text-slate-500"}
                  `}
                  />
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-slate-700">
            <div className="text-xs text-slate-500">
              <div className="font-medium text-slate-400 mb-1">RiskR Platform</div>
              <div>Professional Trading Analytics</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
