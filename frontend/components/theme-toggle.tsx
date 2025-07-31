"use client";
import { useTheme } from "next-themes";
import React from "react";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <button
      aria-label="Toggle dark mode"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="rounded-md border border-border bg-card p-2 transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
      type="button"
    >
      <span className="text-xl" aria-hidden>
        {resolvedTheme === "dark" ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
