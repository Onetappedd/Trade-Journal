"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Menu } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Trades", href: "/trades" },
  { label: "Add Trade", href: "/trades/add" },
  { label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger for mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50"
        aria-label="Open sidebar"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </Button>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}
      {/* Sidebar */}
      <nav
        className={clsx(
          "fixed z-50 top-0 left-0 h-full w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-transform duration-200 ease-in-out",
          "lg:translate-x-0 lg:static lg:block",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        aria-label="Sidebar navigation"
      >
        <div className="flex items-center h-16 px-6 font-bold text-xl border-b border-zinc-200 dark:border-zinc-800 select-none">
          Trade Journal
        </div>
        <ul className="flex-1 py-4 px-2 space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <Button
                  asChild
                  variant="ghost"
                  className="w-full justify-start px-4 py-2 text-base"
                  onClick={() => setOpen(false)}
                >
                  <a>{item.label}</a>
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
