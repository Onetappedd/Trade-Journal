"use client"

import { TrendingTickersTable } from "@/components/trending-tickers/TrendingTickersTable"
import { TickerTape } from "@/components/trending-tickers/TickerTape"
import { TrendingFilters } from "@/components/trending-tickers/TrendingFilters"
import { useState } from "react"

export default function TrendingTickersPage() {
  const [assetType, setAssetType] = useState<"stocks" | "etfs" | "crypto">("stocks")
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Trending Tickers</h2>
        <p className="text-muted-foreground">Discover what's moving in the market today</p>
      </div>

      <TickerTape />

      <TrendingFilters
        assetType={assetType}
        setAssetType={setAssetType}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <TrendingTickersTable assetType={assetType} searchQuery={searchQuery} />
    </div>
  )
}
