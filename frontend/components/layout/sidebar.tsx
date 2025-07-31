"use client";
import {
  Home,
  List,
  PlusCircle,
  Settings,
  BarChart2,
  TrendingUp,
  LogOut,
  Import,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/trending", label: "Trending", icon: TrendingUp },
  // Trades section will be handled separately
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const isActive = (href: string) => pathname === href;
  const isTradeSection = pathname.startsWith("/trades") || pathname === "/import";
  return (
    <div className="hidden border-r bg-background md:block w-64 min-h-screen">
      <div className="flex h-16 items-center border-b px-6 font-bold text-xl tracking-tight">
        Trade Journal
      </div>
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <ul className="space-y-2">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-colors hover:bg-muted hover:text-foreground ${isActive(href) ? "bg-muted text-foreground" : "text-muted-foreground"}`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            </li>
          ))}
          {/* Trades Section */}
          <li>
            <div className={`flex items-center gap-3 px-3 py-2 text-base font-semibold uppercase tracking-wide text-muted-foreground ${isTradeSection ? "text-foreground" : ""}`}>Trades</div>
            <ul className="ml-4 space-y-1">
              <li>
                <Link
                  href="/trades"
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-colors hover:bg-muted hover:text-foreground ${isActive("/trades") ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                >
                  <List className="h-5 w-5" />
                  <span>Trade List</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/trades/add"
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-colors hover:bg-muted hover:text-foreground ${isActive("/trades/add") ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                >
                  <PlusCircle className="h-5 w-5" />
                  <span>Add Trade</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/import"
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-colors hover:bg-muted hover:text-foreground ${isActive("/import") ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                >
                  <Import className="h-5 w-5" />
                  <span>Import Trades</span>
                </Link>
              </li>
            </ul>
          </li>
          {/* Settings below Trades */}
          <li>
            <Link
              href="/settings"
              className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-colors hover:bg-muted hover:text-foreground ${isActive("/settings") ? "bg-muted text-foreground" : "text-muted-foreground"}`}
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>
      <div className="border-t p-4">
        <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
