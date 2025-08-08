"use client"

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

import { TradeTable } from "@/components/trades/TradeTable"
import { TradeStats } from "@/components/trades/TradeStats"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { RefreshCw } from "lucide-react"
import { useState } from "react"

export default function TradeHistoryPage() {
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)

  async function updateTradeStatuses() {
    setIsUpdating(true)
    try {
      const res = await fetch("/api/update-trade-status", {
        method: "POST",
      })
      
      const result = await res.json()
      
      if (res.ok) {
        toast({ 
          title: "Trade statuses updated", 
          description: `Updated ${result.updated} trades`,
          variant: "default" 
        })
        // Refresh the page to show updated statuses
        window.location.reload()
      } else {
        toast({ 
          title: "Failed to update statuses", 
          description: result.error || "Unknown error", 
          variant: "destructive" 
        })
      }
    } catch (error) {
      toast({ 
        title: "Failed to update statuses", 
        description: String(error), 
        variant: "destructive" 
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Trade History</h2>
          <p className="text-muted-foreground">View and manage your trading history</p>
        </div>
        <Button 
          onClick={updateTradeStatuses}
          disabled={isUpdating}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
          {isUpdating ? "Updating..." : "Update Statuses"}
        </Button>
      </div>

      <TradeStats />
      <TradeTable />
    </div>
  )
}