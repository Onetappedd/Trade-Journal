"use client"

import { useState, useEffect } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

// Mock data
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

const assetAllocation = [
  { name: "Stocks", value: 65, color: "#8884d8" },
  { name: "Options", value: 25, color: "#82ca9d" },
  { name: "Crypto", value: 10, color: "#ffc658" },
]

export default function DashboardPage() {
  const [totalPnL, setTotalPnL] = useState(0)
  const [winRate, setWinRate] = useState(0)
  const [totalTrades, setTotalTrades] = useState(0)

  useEffect(() => {
    // Calculate metrics from performance data
    const total = performanceData.reduce((sum, month) => sum + month.pnl, 0)
    const trades = performanceData.reduce((sum, month) => sum + month.trades, 0)
    const winningMonths = performanceData.filter((month) => month.pnl > 0).length
    const rate = (winningMonths / performanceData.length) * 100

    setTotalPnL(total)
    setTotalTrades(trades)
    setWinRate(rate)
  }, [])

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Overview</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="aspect-video rounded-xl bg-muted/50" />
          <div className="aspect-video rounded-xl bg-muted/50" />
          <div className="aspect-video rounded-xl bg-muted/50" />
        </div>
        <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
      </div>
    </>
  )
}
