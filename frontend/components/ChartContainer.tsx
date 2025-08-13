"use client"
import React from "react"

export function ChartContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-chart
      className="text-muted-foreground"
      style={{
        // Set chart tokens for CSS vars
        // You can map these in your tailwind config or define as needed
        // --success: green, --danger: red, --axis: muted-foreground, --grid: border, --card: card, etc.
        // These are hsl(var(--color)) mapped to tailwindcss
        //@ts-ignore
        '--success': 'var(--chart-success, 158, 95%, 40%)',
        '--danger': 'var(--chart-danger, 0, 80%, 57%)',
        '--axis': 'var(--muted-foreground)',
        '--grid': 'var(--border)',
        '--card': 'var(--card)',
        '--card-foreground': 'var(--card-foreground)',
      } as React.CSSProperties}
    >
      {children}
    </div>
  )
}
