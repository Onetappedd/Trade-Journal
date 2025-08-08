"use client"

import { TradeTable } from "@/components/trades/TradeTable"
import { TradeStats } from "@/components/trades/TradeStats"

export default function TradesPage() {
  return (
    <div className="max-w-7xl mx-auto flex-1 space-y-6 p-4 md:p-8 pt-6">
      <h1 className="text-2xl font-bold mb-4">Trade History</h1>
      <TradeStats />
      <TradeTable />
    </div>
  )
}
