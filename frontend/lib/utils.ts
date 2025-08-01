import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date))
}

export function getProfitLossColor(value: number): string {
  if (value > 0) return "text-green-600"
  if (value < 0) return "text-red-600"
  return "text-muted-foreground"
}

export function calculateTotalPnL(trades: any[]): number {
  return trades.reduce((total, trade) => total + (trade.pnl || 0), 0)
}

export function calculateWinRate(trades: any[]): number {
  const closedTrades = trades.filter((trade) => trade.status === "closed" && trade.pnl !== null)
  if (closedTrades.length === 0) return 0
  const winningTrades = closedTrades.filter((trade) => trade.pnl > 0)
  return (winningTrades.length / closedTrades.length) * 100
}

export function calculateAverageProfit(trades: any[]): number {
  if (trades.length === 0) return 0
  const totalPnL = calculateTotalPnL(trades)
  return totalPnL / trades.length
}

export function formatProfitLoss(value: number): string {
  const formatted = formatCurrency(Math.abs(value))
  return value >= 0 ? `+${formatted}` : `-${formatted}`
}
