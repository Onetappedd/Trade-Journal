"use client"
import { DashboardPage } from "@/components/dashboard-page"

// Mock data for the dashboard
const performanceData = [
  { date: "Jan", pnl: 1200, trades: 15 },
  { date: "Feb", pnl: -800, trades: 12 },
  { date: "Mar", pnl: 2100, trades: 18 },
  { date: "Apr", pnl: 1500, trades: 20 },
  { date: "May", pnl: -300, trades: 8 },
  { date: "Jun", pnl: 2800, trades: 25 },
]

const recentTrades = [
  {
    id: "1",
    symbol: "AAPL",
    type: "Stock",
    pnl: 175.0,
    date: "2024-01-15",
    status: "closed",
  },
  {
    id: "2",
    symbol: "TSLA",
    type: "Option",
    pnl: -650.0,
    date: "2024-01-14",
    status: "closed",
  },
  {
    id: "3",
    symbol: "NVDA",
    type: "Stock",
    pnl: 0,
    date: "2024-01-13",
    status: "open",
  },
]

const goals = [
  { name: "Monthly P&L Target", current: 6500, target: 10000, unit: "$" },
  { name: "Win Rate", current: 68, target: 75, unit: "%" },
  { name: "Risk/Reward Ratio", current: 1.8, target: 2.0, unit: ":1" },
]

export default function DashboardClientPage() {
  return <DashboardPage />
}
