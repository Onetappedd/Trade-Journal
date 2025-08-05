"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Search, Filter } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

interface FilterState {
  ticker: string
  assetType: string
  broker: string
  dateFrom: string
  dateTo: string
  pnlMin: string
  pnlMax: string
  tags: string[]
  status: string
}

interface TradeFiltersProps {
  onFiltersChange: (filters: FilterState) => void
}

const PREDEFINED_TAGS = [
  "Scalp",
  "Swing",
  "Day Trade",
  "Breakout",
  "Reversal",
  "Momentum",
  "Emotional",
  "FOMO",
  "Revenge Trade",
  "Planned",
]

export function TradeFilters({ onFiltersChange }: TradeFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState<FilterState>({
    ticker: searchParams.get("ticker") || "",
    assetType: searchParams.get("assetType") || "all",
    broker: searchParams.get("broker") || "all",
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
    pnlMin: searchParams.get("pnlMin") || "",
    pnlMax: searchParams.get("pnlMax") || "",
    tags: searchParams.get("tags")?.split(",").filter(Boolean) || [],
    status: searchParams.get("status") || "all",
  })

  const [showAdvanced, setShowAdvanced] = useState(false)
  const debouncedFilters = useDebounce(filters, 300)

  useEffect(() => {
    // Only call onFiltersChange, don't update URL here to prevent loops
    onFiltersChange(debouncedFilters)
  }, [debouncedFilters, onFiltersChange])

  // Separate effect for URL updates to prevent infinite loops
  useEffect(() => {
    const params = new URLSearchParams()
    Object.entries(debouncedFilters).forEach(([key, value]) => {
      if (value && value.length > 0 && value !== "all") {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            params.set(key, value.join(","))
          }
        } else {
          params.set(key, value)
        }
      }
    })

    const queryString = params.toString()
    const newUrl = `/trade-history${queryString ? `?${queryString}` : ""}`

    // Only update URL if it's actually different
    if (window.location.pathname + window.location.search !== newUrl) {
      router.replace(newUrl, { scroll: false })
    }
  }, [debouncedFilters, router])

  const updateFilter = (key: keyof FilterState, value: string | string[]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const addTag = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      updateFilter("tags", [...filters.tags, tag])
    }
  }

  const removeTag = (tag: string) => {
    updateFilter(
      "tags",
      filters.tags.filter((t) => t !== tag),
    )
  }

  const clearFilters = () => {
    setFilters({
      ticker: "",
      assetType: "all",
      broker: "all",
      dateFrom: "",
      dateTo: "",
      pnlMin: "",
      pnlMax: "",
      tags: [],
      status: "all",
    })
  }

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (Array.isArray(value)) {
      return value.length > 0
    }
    return value !== "" && value !== "all"
  })

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ticker">Ticker Symbol</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="ticker"
                placeholder="e.g., AAPL"
                value={filters.ticker}
                onChange={(e) => updateFilter("ticker", e.target.value.toUpperCase())}
                className="pl-8"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Asset Type</Label>
            <Select value={filters.assetType} onValueChange={(value) => updateFilter("assetType", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="stock">Stock</SelectItem>
                <SelectItem value="option">Option</SelectItem>
                <SelectItem value="futures">Futures</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Broker</Label>
            <Select value={filters.broker} onValueChange={(value) => updateFilter("broker", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All brokers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brokers</SelectItem>
                <SelectItem value="webull">Webull</SelectItem>
                <SelectItem value="robinhood">Robinhood</SelectItem>
                <SelectItem value="schwab">Charles Schwab</SelectItem>
                <SelectItem value="ibkr">Interactive Brokers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All trades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trades</SelectItem>
                <SelectItem value="open">Open Trades</SelectItem>
                <SelectItem value="closed">Closed Trades</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-muted-foreground"
          >
            <Filter className="mr-2 h-4 w-4" />
            Advanced Filters
          </Button>

          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">Date From</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilter("dateFrom", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">Date To</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => updateFilter("dateTo", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pnlMin">Min P&L ($)</Label>
                <Input
                  id="pnlMin"
                  type="number"
                  placeholder="0.00"
                  value={filters.pnlMin}
                  onChange={(e) => updateFilter("pnlMin", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pnlMax">Max P&L ($)</Label>
                <Input
                  id="pnlMax"
                  type="number"
                  placeholder="1000.00"
                  value={filters.pnlMax}
                  onChange={(e) => updateFilter("pnlMax", e.target.value)}
                />
              </div>
            </div>

            {/* Tags Filter */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <Select onValueChange={addTag}>
                <SelectTrigger>
                  <SelectValue placeholder="Add tag filter" />
                </SelectTrigger>
                <SelectContent>
                  {PREDEFINED_TAGS.filter((tag) => !filters.tags.includes(tag)).map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {filters.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {filters.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer">
                      {tag}
                      <X className="ml-1 h-3 w-3" onClick={() => removeTag(tag)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
