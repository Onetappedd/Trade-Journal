"use client"

import { useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Filter } from "lucide-react"
import { format } from "date-fns"
import { useAnalyticsFilters } from "@/store/analytics-filters"

export function AnalyticsFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const search = useSearchParams()
  const store = useAnalyticsFilters()

  // Initialize from URL on mount
  useEffect(() => {
    store.initFromSearchParams(search)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyFilters = () => {
    const params = store.toSearchParams(new URLSearchParams(search.toString()))
    router.push(`${pathname}?${params.toString()}`)
  }

  const isCustom = store.timeRange === "custom"

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <Select value={store.timeRange} onValueChange={(v) => store.setTimeRange(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 Month</SelectItem>
              <SelectItem value="3m">3 Months</SelectItem>
              <SelectItem value="6m">6 Months</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          <Select value={store.assetType} onValueChange={(v) => store.setAssetType(v as any)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Asset Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assets</SelectItem>
              <SelectItem value="stock">Stocks</SelectItem>
              <SelectItem value="option">Options</SelectItem>
              <SelectItem value="futures">Futures</SelectItem>
              <SelectItem value="crypto">Crypto</SelectItem>
            </SelectContent>
          </Select>

          <Select value={store.strategy} onValueChange={(v) => store.setStrategy(v as any)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Strategy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Strategies</SelectItem>
              <SelectItem value="swing">Swing Trading</SelectItem>
              <SelectItem value="day">Day Trading</SelectItem>
              <SelectItem value="scalp">Scalping</SelectItem>
              <SelectItem value="long">Long Term</SelectItem>
            </SelectContent>
          </Select>

          {isCustom && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40 justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {store.dateFrom ? format(store.dateFrom, "PPP") : "From Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={store.dateFrom} onSelect={(d) => store.setDates(d ?? undefined, store.dateTo)} initialFocus />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40 justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {store.dateTo ? format(store.dateTo, "PPP") : "To Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={store.dateTo} onSelect={(d) => store.setDates(store.dateFrom, d ?? undefined)} initialFocus />
                </PopoverContent>
              </Popover>
            </>
          )}

          <Button variant="outline" size="icon" onClick={applyFilters}>
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
