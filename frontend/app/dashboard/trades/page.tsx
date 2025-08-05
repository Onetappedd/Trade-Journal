"use client"

import { useState } from "react"
import { TradesStats } from "@/components/trades/TradesStats"
import { TradesFilters } from "@/components/trades/TradesFilters"
import { TradesTable } from "@/components/trades/TradesTable"
import { AddTradeDialog } from "@/components/trades/AddTradeDialog"
import { ImportTradesDialog } from "@/components/trades/ImportTradesDialog"
import { Button } from "@/components/ui/button"
import { Plus, Upload } from "lucide-react"

export default function TradesPage() {
  const [showAddTrade, setShowAddTrade] = useState(false)
  const [showImportTrades, setShowImportTrades] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Trades</h2>
          <p className="text-muted-foreground">Manage and analyze your trading positions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowImportTrades(true)} variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import Trades
          </Button>
          <Button onClick={() => setShowAddTrade(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Trade
          </Button>
        </div>
      </div>

      <TradesStats />
      <TradesFilters />
      <TradesTable />

      <AddTradeDialog open={showAddTrade} onOpenChange={setShowAddTrade} />
      <ImportTradesDialog open={showImportTrades} onOpenChange={setShowImportTrades} />
    </div>
  )
}
