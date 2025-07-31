"use client";
import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { Sun, Moon, Menu, User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useState } from "react";

export function TopNav({ onSidebarToggle }: { onSidebarToggle?: () => void }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // Avoid hydration mismatch for theme
  React.useEffect(() => setMounted(true), []);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      {/* Hamburger for mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden mr-2"
        aria-label="Open sidebar"
        onClick={onSidebarToggle}
      >
        <Menu className="h-6 w-6" />
      </Button>
      {/* App Title */}
      <span className="font-bold text-lg tracking-tight select-none">Trade Journal</span>
      <div className="flex-1" />
      {/* Dark mode toggle */}
      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle dark mode"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="mr-2"
      >
        {mounted && (theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />)}
      </Button>
      {/* User profile dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open user menu">
            <User className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
