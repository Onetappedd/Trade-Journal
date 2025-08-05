"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

interface TrendingFiltersProps {
  assetType: "stocks" | "etfs" | "crypto"
  setAssetType: (type: "stocks" | "etfs" | "crypto") => void
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export function TrendingFilters({ assetType, setAssetType, searchQuery, setSearchQuery }: TrendingFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex gap-2">
        <Button
          variant={assetType === "stocks" ? "default" : "outline"}
          size="sm"
          onClick={() => setAssetType("stocks")}
        >
          Stocks
        </Button>
        <Button variant={assetType === "etfs" ? "default" : "outline"} size="sm" onClick={() => setAssetType("etfs")}>
          ETFs
        </Button>
        <Button
          variant={assetType === "crypto" ? "default" : "outline"}
          size="sm"
          onClick={() => setAssetType("crypto")}
        >
          Crypto
        </Button>
      </div>

      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search ticker or company name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  )
}
