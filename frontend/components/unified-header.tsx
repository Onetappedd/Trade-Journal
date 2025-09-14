"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Moon,
  Sun,
  Monitor,
  Menu,
  User,
  Settings,
  LogOut,
  Search,
  Bell,
  X,
  ChevronRight,
  Home,
  BarChart3,
  TrendingUp,
  History,
  Upload,
  Trophy,
  FileText,
  CreditCard,
  CalendarIcon,
} from "lucide-react"
import { useTheme } from "./theme-provider"
import { useAuth } from "@/providers/auth-provider"

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

export function UnifiedHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { setTheme, theme } = useTheme()
  const { user, signOut } = useAuth()
  const pathname = usePathname()

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/50 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80">
        <div className="container flex h-16 max-w-screen-2xl items-center px-4 sm:px-6 lg:px-8">
          {/* Left: Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="font-bold text-xl text-white">RiskR</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-2">
              {menuItems.slice(1, 6).map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-emerald-600 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Center: Search */}
          <div className="flex-1 flex justify-center px-8">
            <div className="relative w-full max-w-lg">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search trades, symbols..."
                className="pl-10 bg-slate-800/50 border-slate-700/50 text-white placeholder-slate-500 focus-visible:ring-1 focus-visible:ring-emerald-500 w-full"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-3">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="h-9 w-9 p-0 md:hidden text-slate-300 hover:text-white hover:bg-slate-800/50"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 relative text-slate-300 hover:text-white hover:bg-slate-800/50">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                3
              </span>
              <span className="sr-only">Notifications</span>
            </Button>

            {/* Settings */}
            <Button variant="ghost" size="sm" asChild className="h-9 w-9 p-0 text-slate-300 hover:text-white hover:bg-slate-800/50">
              <Link href="/settings">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Link>
            </Button>

            {/* Theme Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-slate-300 hover:text-white hover:bg-slate-800/50">
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[140px] bg-slate-900 border-slate-800">
                <DropdownMenuItem onClick={() => setTheme("light")} className={`${theme === "light" ? "bg-slate-800" : ""} text-slate-300 hover:text-white hover:bg-slate-800`}>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className={`${theme === "dark" ? "bg-slate-800" : ""} text-slate-300 hover:text-white hover:bg-slate-800`}>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("system")}
                  className={`${theme === "system" ? "bg-slate-800" : ""} text-slate-300 hover:text-white hover:bg-slate-800`}
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  <span>System</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt="User" />
                    <AvatarFallback className="bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-900 font-medium text-sm">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-slate-900 border-slate-800" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-white">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}</p>
                    <p className="w-[200px] truncate text-sm text-slate-400">{user?.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer text-slate-300 hover:text-white hover:bg-slate-800">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer text-slate-300 hover:text-white hover:bg-slate-800">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem 
                  className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-slate-800"
                  onClick={() => signOut()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Mobile Staggered Menu */}
          <div className="fixed top-0 right-0 h-full w-80 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 z-40 md:hidden transform transition-transform duration-500 ease-out">
            <div className="p-6 pt-20">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(false)}
                className="absolute top-4 right-4 text-slate-200 hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </Button>

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
                      onClick={() => setIsMenuOpen(false)}
                      className={`
                        group flex items-center p-4 rounded-lg transition-all duration-300 ease-out
                        hover:bg-slate-800 hover:translate-x-2 border border-transparent
                        ${isActive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "text-slate-300"}
                      `}
                      style={{
                        animationDelay: `${index * 100}ms`,
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
      )}
    </>
  )
}
