"use client";
import { Menu } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import ThemeToggle from "../theme-toggle";
import { useState } from "react";

export function Header() {
  // For mobile sidebar toggle, handled in Sidebar
  return (
    <header className="h-16 bg-card border-b border-border sticky top-0 z-10 flex items-center justify-between px-6">
      {/* Left: Logo or App Name */}
      <div className="font-bold text-xl tracking-tight">Trade Journal</div>
      {/* Right: User menu, theme toggle, hamburger (mobile) */}
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="w-8 h-8 cursor-pointer">
              <AvatarImage src="/avatar.png" alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
