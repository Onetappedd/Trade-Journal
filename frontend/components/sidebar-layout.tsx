"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Moon,
  Sun,
  Monitor,
  User,
  Settings,
  LogOut,
  Search,
  Bell,
  LayoutDashboard,
  CreditCard,
  HelpCircle,
} from "lucide-react"
import { useTheme } from "./theme-provider"
import { useAuth } from "@/providers/auth-provider"
import { StaggeredSidebarMenu } from "./staggered-sidebar-menu"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

function AppSidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { state, toggleSidebar } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <Sidebar variant="inset" className="border-slate-800/50 bg-slate-950/95">
      <SidebarHeader className="border-b border-slate-800/50">
        <div className={cn(
          "flex items-center gap-2 px-2 py-2 transition-all duration-300",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-lg text-white">RiskR</span>
                <span className="text-xs text-slate-400">Trading Platform</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800/50"
                    onClick={() => toggleSidebar()}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-slate-900 border-slate-700 text-white">
                  <p>Collapse sidebar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-slate-950/95 p-4">
        <div className="space-y-6">
          {/* Navigation Section */}
          <div>
            {!isCollapsed && (
              <h3 className="text-slate-400 font-medium text-sm mb-3 px-3">Navigation</h3>
            )}
            <StaggeredSidebarMenu />
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-800/50 p-2">
        <div className={cn(
          "flex items-center gap-2 p-2 transition-all duration-300",
          isCollapsed ? "justify-center" : ""
        )}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt="User" />
            <AvatarFallback className="bg-emerald-600 text-white font-medium text-sm">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <>
              <div className="flex flex-col min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-slate-900 border-slate-800" align="end">
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
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

function AppHeader() {
  const { setTheme, theme } = useTheme()
  const { user, signOut, supabase } = useAuth()
  const { toast } = useToast()
  const [username, setUsername] = useState<string | null>(null)

  // Fetch username from profiles table
  useEffect(() => {
    async function fetchUsername() {
      if (user && supabase) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single()
          
          if (!error && data?.username) {
            setUsername(data.username)
          }
        } catch (error) {
          // Username not set yet, that's okay
          console.log('No username found in profile')
        }
      }
    }
    fetchUsername()
  }, [user, supabase])

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-800/50 bg-slate-950/95 px-4 relative z-10">
      <SidebarTrigger className="h-9 w-9 text-slate-300 hover:text-white hover:bg-slate-800/50 border border-slate-700/50 rounded-md transition-all duration-200 hover:border-emerald-500/50" />
      
      {/* Search Bar */}
      <div className="flex-1 flex justify-center px-8">
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search trades, symbols..."
            className="pl-10 bg-slate-800/50 border-slate-700/50 text-white placeholder-slate-500 focus-visible:ring-1 focus-visible:ring-emerald-500 w-full"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const query = e.currentTarget.value
                if (query.trim()) {
                  toast({
                    title: "Search",
                    description: `Searching for "${query}"...`,
                  })
                }
              }
            }}
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              type="button"
              className="h-9 w-9 p-0 relative text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-md flex items-center justify-center"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                3
              </span>
              <span className="sr-only">Notifications</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-slate-900 border-slate-800 z-[100]">
            <div className="p-3 border-b border-slate-800">
              <h3 className="font-semibold text-white">Notifications</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              <div className="p-3 border-b border-slate-800/50">
                <p className="text-sm text-slate-300">New trade executed: AAPL</p>
                <p className="text-xs text-slate-500 mt-1">2 minutes ago</p>
              </div>
              <div className="p-3 border-b border-slate-800/50">
                <p className="text-sm text-slate-300">Portfolio value updated</p>
                <p className="text-xs text-slate-500 mt-1">1 hour ago</p>
              </div>
              <div className="p-3">
                <p className="text-sm text-slate-300">Weekly performance report ready</p>
                <p className="text-xs text-slate-500 mt-1">1 day ago</p>
              </div>
            </div>
            <div className="p-2 border-t border-slate-800">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-slate-300 hover:text-white hover:bg-slate-800"
                onClick={() => {
                  toast({
                    title: "Notifications",
                    description: "All notifications feature coming soon!",
                  })
                }}
              >
                View All Notifications
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              type="button"
              className="h-9 w-9 p-0 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-md flex items-center justify-center relative"
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[140px] bg-slate-900 border-slate-800 z-[100]">
            <DropdownMenuItem 
              onClick={() => {
                setTheme("light")
                toast({
                  title: "Theme Changed",
                  description: "Switched to light mode",
                })
              }} 
              className={`${theme === "light" ? "bg-slate-800" : ""} text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer`}
            >
              <Sun className="mr-2 h-4 w-4" />
              <span>Light</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => {
                setTheme("dark")
                toast({
                  title: "Theme Changed",
                  description: "Switched to dark mode",
                })
              }} 
              className={`${theme === "dark" ? "bg-slate-800" : ""} text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer`}
            >
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setTheme("system")
                toast({
                  title: "Theme Changed",
                  description: "Switched to system theme",
                })
              }}
              className={`${theme === "system" ? "bg-slate-800" : ""} text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer`}
            >
              <Monitor className="mr-2 h-4 w-4" />
              <span>System</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              type="button"
              className="relative h-9 w-9 rounded-full p-0 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url} alt="User" />
                <AvatarFallback className="bg-emerald-600 text-white font-medium text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-slate-900 border-slate-800 z-[100]" align="end">
            {/* User Info Header */}
            <div className="flex items-center justify-start gap-2 p-3 border-b border-slate-800">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.user_metadata?.avatar_url} alt="User" />
                <AvatarFallback className="bg-emerald-600 text-white font-medium text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-0.5 leading-none min-w-0 flex-1">
                <p className="font-semibold text-white truncate">
                  {username ? `@${username}` : user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="w-full truncate text-xs text-slate-400">{user?.email}</p>
              </div>
            </div>
            
            <DropdownMenuSeparator className="bg-slate-800" />
            
            {/* Navigation Items */}
            <DropdownMenuItem className="cursor-pointer text-slate-300 hover:text-white hover:bg-slate-800">
              <Link href="/dashboard" className="flex items-center w-full">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem className="cursor-pointer text-slate-300 hover:text-white hover:bg-slate-800">
              <Link href="/dashboard/profile" className="flex items-center w-full">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem className="cursor-pointer text-slate-300 hover:text-white hover:bg-slate-800">
              <Link href="/settings" className="flex items-center w-full">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem className="cursor-pointer text-slate-300 hover:text-white hover:bg-slate-800">
              <Link href="/dashboard/billing" className="flex items-center w-full">
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="bg-slate-800" />
            
            <DropdownMenuItem 
              className="cursor-pointer text-slate-300 hover:text-white hover:bg-slate-800"
              onClick={() => {
                toast({
                  title: "Help & Support",
                  description: "Contact support@riskr.net for assistance",
                })
              }}
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Help & Support</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="bg-slate-800" />
            
            <DropdownMenuItem 
              className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-slate-800 focus:text-red-300 focus:bg-slate-800"
              onClick={async () => {
                try {
                  await signOut()
                  toast({
                    title: "Signed out",
                    description: "You have been signed out successfully",
                  })
                  // Redirect to login page
                  window.location.href = '/auth/login'
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to sign out. Please try again.",
                    variant: "destructive"
                  })
                }
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 overflow-auto bg-slate-950 text-slate-100">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
