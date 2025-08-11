"use client"

import { useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Filter } from "lucide-react"
import { format } from "date-fns"

export function AnalyticsFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const search = useSearchParams()

  const [timeRange, setTimeRange] = useState(search.get('time') || "3m")
  const [assetType, setAssetType] = useState(search.get('assetType') || "all")
  const [strategy, setStrategy] = useState(search.get('strategy') || "all")
  const [dateFrom, setDateFrom] = useState<Date | undefined>(search.get('start') ? new Date(search.get('start')!) : undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(search.get('end') ? new Date(search.get('end')!) : undefined)

  const applyFilters = () => {
    const params = new URLSearchParams(search.toString())
    params.set('time', timeRange)
    params.set('assetType', assetType)
    params.set('strategy', strategy)
    if (timeRange === 'custom') {
      if (dateFrom) params.set('start', dateFrom.toISOString())
      if (dateTo) params.set('end', dateTo.toISOString())
    } else {
      params.delete('start'); params.delete('end')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
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

          <Select value={assetType} onValueChange={setAssetType}>
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

          <Select value={strategy} onValueChange={setStrategy}>
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

          {timeRange === "custom" && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40 justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP") : "From Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40 justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP") : "To Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
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
