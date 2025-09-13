"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Moon, Sun, Monitor, Menu, User, Settings, LogOut } from "lucide-react"
import { useTheme } from "./theme-provider"

interface GlobalHeaderProps {
  title?: string
}

export function GlobalHeader({ title }: GlobalHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { setTheme, theme } = useTheme()
  const pathname = usePathname()

  // Get page title based on current route
  const getPageTitle = () => {
    if (title) return title

    const titles: Record<string, string> = {
      "/": "RiskR",
      "/dashboard": "Dashboard",
      "/analytics": "Analytics",
      "/trades": "Trade History",
      "/journal": "Journal",
      "/import": "Import Trades",
      "/leaderboard": "Leaderboard",
      "/settings": "Settings",
    }

    return titles[pathname] || "RiskR"
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Safe area padding for iOS */}
      <div className="safe-area-inset-top" />

      <div className="container flex h-14 max-w-screen-2xl items-center px-4 sm:px-6 lg:px-8">
        {/* Left: Nav Trigger */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="h-11 w-11 p-0 hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>

        {/* Center: Page Title */}
        <div className="flex-1 flex justify-center">
          <h1 className="text-lg font-semibold text-foreground truncate">{getPageTitle()}</h1>
        </div>

        {/* Right: Header Actions */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-11 w-11 p-0 hover:bg-accent">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
              <DropdownMenuItem onClick={() => setTheme("light")} className={theme === "light" ? "bg-accent/10" : ""}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")} className={theme === "dark" ? "bg-accent/10" : ""}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")} className={theme === "system" ? "bg-accent/10" : ""}>
                <Monitor className="mr-2 h-4 w-4" />
                <span>System</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-11 w-11 rounded-full p-0 hover:bg-accent">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="/avatars/user.jpg" alt="User" />
                  <AvatarFallback className="bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-900 font-medium">
                    JD
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">John Doe</p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">john.doe@example.com</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-600 dark:text-red-400">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 sm:hidden"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Mobile Menu Panel */}
          <div className="fixed top-14 left-0 right-0 bg-background border-b border-border z-40 sm:hidden">
            <nav className="container py-4 space-y-2">
              <Link
                href="/dashboard"
                className="flex items-center px-4 py-2 text-sm font-medium rounded-md hover:bg-accent"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/analytics"
                className="flex items-center px-4 py-2 text-sm font-medium rounded-md hover:bg-accent"
                onClick={() => setIsMenuOpen(false)}
              >
                Analytics
              </Link>
              <Link
                href="/trades"
                className="flex items-center px-4 py-2 text-sm font-medium rounded-md hover:bg-accent"
                onClick={() => setIsMenuOpen(false)}
              >
                Trade History
              </Link>
              <Link
                href="/journal"
                className="flex items-center px-4 py-2 text-sm font-medium rounded-md hover:bg-accent"
                onClick={() => setIsMenuOpen(false)}
              >
                Journal
              </Link>
              <Link
                href="/import"
                className="flex items-center px-4 py-2 text-sm font-medium rounded-md hover:bg-accent"
                onClick={() => setIsMenuOpen(false)}
              >
                Import Trades
              </Link>
              <Link
                href="/leaderboard"
                className="flex items-center px-4 py-2 text-sm font-medium rounded-md hover:bg-accent"
                onClick={() => setIsMenuOpen(false)}
              >
                Leaderboard
              </Link>
              <Link
                href="/settings"
                className="flex items-center px-4 py-2 text-sm font-medium rounded-md hover:bg-accent"
                onClick={() => setIsMenuOpen(false)}
              >
                Settings
              </Link>
            </nav>
          </div>
        </>
      )}
    </header>
  )
}
