'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2 } from 'lucide-react'
import type { ScannerFilters, SortConfig } from '@/hooks/useScannerState'

interface ScannerFiltersProps {
  filters: ScannerFilters
  onFiltersChange: (filters: ScannerFilters) => void
  sortConfig: SortConfig[]
  onSortChange: (sort: SortConfig[]) => void
  visibleColumns: string[]
  onColumnsChange: (columns: string[]) => void
}

const UNIVERSE_OPTIONS = [
  { value: 'stocks', label: 'Stocks' },
  { value: 'options', label: 'Options' },
  { value: 'futures', label: 'Futures' },
  { value: 'crypto', label: 'Crypto' }
]

const MARKET_CAP_OPTIONS = [
  { value: 'micro', label: 'Micro (<$50M)' },
  { value: 'small', label: 'Small ($50M-$2B)' },
  { value: 'mid', label: 'Mid ($2B-$10B)' },
  { value: 'large', label: 'Large ($10B-$100B)' },
  { value: 'mega', label: 'Mega (>$100B)' }
]

const MA_CROSS_OPTIONS = [
  { value: '20>50', label: '20EMA > 50EMA' },
  { value: '50>200', label: '50EMA > 200EMA' }
]

const DELTA_BUCKET_OPTIONS = [
  { value: '0.2', label: '0.2' },
  { value: '0.3', label: '0.3' },
  { value: '0.5', label: '0.5' }
]

const CONTRACT_ROOT_OPTIONS = [
  { value: 'ES', label: 'ES (E-mini S&P 500)' },
  { value: 'NQ', label: 'NQ (E-mini NASDAQ)' },
  { value: 'CL', label: 'CL (Crude Oil)' },
  { value: 'GC', label: 'GC (Gold)' }
]

const SECTOR_OPTIONS = [
  'Technology', 'Healthcare', 'Financial', 'Consumer Discretionary',
  'Consumer Staples', 'Energy', 'Industrials', 'Materials',
  'Real Estate', 'Utilities', 'Communication Services'
]

const COLUMN_OPTIONS = [
  { value: 'symbol', label: 'Symbol' },
  { value: 'name', label: 'Name' },
  { value: 'sector', label: 'Sector' },
  { value: 'price', label: 'Price' },
  { value: 'change', label: '% Change' },
  { value: 'volume', label: 'Volume' },
  { value: 'rvol', label: 'RVOL' },
  { value: 'week52High', label: '52W High %' },
  { value: 'week52Low', label: '52W Low %' },
  { value: 'atrPercent', label: 'ATR %' },
  { value: 'rsi', label: 'RSI' },
  { value: 'winRate', label: 'Win Rate' },
  { value: 'avgPnl', label: 'Avg P&L' },
  { value: 'tradesCount', label: 'Trades' },
  { value: 'lastTraded', label: 'Last Traded' }
]

export function ScannerFilters({
  filters,
  onFiltersChange,
  sortConfig,
  onSortChange,
  visibleColumns,
  onColumnsChange
}: ScannerFiltersProps) {
  const [isApplying, setIsApplying] = useState(false)

  const updateFilter = (key: keyof ScannerFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const handleApply = async () => {
    setIsApplying(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsApplying(false)
  }

  const handleClear = () => {
    onFiltersChange({})
    onSortChange([])
    onColumnsChange(['symbol', 'name', 'price', 'change', 'volume'])
  }

  return (
    <div className="p-4 space-y-4">
      <ScrollArea className="h-[calc(100vh-400px)]">
        <Accordion type="multiple" defaultValue={['universe', 'price', 'volume']}>
          
          {/* Universe */}
          <AccordionItem value="universe">
            <AccordionTrigger className="text-sm">Universe</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {UNIVERSE_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.value}
                      checked={filters.universe?.includes(option.value) || false}
                      onCheckedChange={(checked) => {
                        const current = filters.universe || []
                        const updated = checked
                          ? [...current, option.value]
                          : current.filter(v => v !== option.value)
                        updateFilter('universe', updated)
                      }}
                    />
                    <Label htmlFor={option.value} className="text-sm">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Price */}
          <AccordionItem value="price">
            <AccordionTrigger className="text-sm">Price</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="priceMin" className="text-xs">Min Price</Label>
                    <Input
                      id="priceMin"
                      type="number"
                      placeholder="0"
                      value={filters.priceMin || ''}
                      onChange={(e) => updateFilter('priceMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="priceMax" className="text-xs">Max Price</Label>
                    <Input
                      id="priceMax"
                      type="number"
                      placeholder="1000"
                      value={filters.priceMax || ''}
                      onChange={(e) => updateFilter('priceMax', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Volume */}
          <AccordionItem value="volume">
            <AccordionTrigger className="text-sm">Volume</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="volumeMin" className="text-xs">Min Volume</Label>
                  <Input
                    id="volumeMin"
                    type="number"
                    placeholder="100000"
                    value={filters.volumeMin || ''}
                    onChange={(e) => updateFilter('volumeMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <Label htmlFor="rvolMin" className="text-xs">Min RVOL</Label>
                  <Input
                    id="rvolMin"
                    type="number"
                    placeholder="1.0"
                    step="0.1"
                    value={filters.rvolMin || ''}
                    onChange={(e) => updateFilter('rvolMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* % Change */}
          <AccordionItem value="change">
            <AccordionTrigger className="text-sm">% Change (1D)</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="changeMin" className="text-xs">Min %</Label>
                  <Input
                    id="changeMin"
                    type="number"
                    placeholder="-10"
                    step="0.1"
                    value={filters.changeMin || ''}
                    onChange={(e) => updateFilter('changeMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <Label htmlFor="changeMax" className="text-xs">Max %</Label>
                  <Input
                    id="changeMax"
                    type="number"
                    placeholder="10"
                    step="0.1"
                    value={filters.changeMax || ''}
                    onChange={(e) => updateFilter('changeMax', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Market Cap */}
          <AccordionItem value="marketCap">
            <AccordionTrigger className="text-sm">Market Cap</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {MARKET_CAP_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.value}
                      checked={filters.marketCap?.includes(option.value) || false}
                      onCheckedChange={(checked) => {
                        const current = filters.marketCap || []
                        const updated = checked
                          ? [...current, option.value]
                          : current.filter(v => v !== option.value)
                        updateFilter('marketCap', updated)
                      }}
                    />
                    <Label htmlFor={option.value} className="text-sm">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Volatility */}
          <AccordionItem value="volatility">
            <AccordionTrigger className="text-sm">Volatility</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="atrMin" className="text-xs">Min ATR</Label>
                  <Input
                    id="atrMin"
                    type="number"
                    placeholder="0.1"
                    step="0.01"
                    value={filters.atrMin || ''}
                    onChange={(e) => updateFilter('atrMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <Label htmlFor="atrPercentMin" className="text-xs">Min ATR %</Label>
                  <Input
                    id="atrPercentMin"
                    type="number"
                    placeholder="1.0"
                    step="0.1"
                    value={filters.atrPercentMin || ''}
                    onChange={(e) => updateFilter('atrPercentMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <Label htmlFor="hv20Min" className="text-xs">Min 20-Day HV</Label>
                  <Input
                    id="hv20Min"
                    type="number"
                    placeholder="10"
                    step="0.1"
                    value={filters.hv20Min || ''}
                    onChange={(e) => updateFilter('hv20Min', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Technicals */}
          <AccordionItem value="technicals">
            <AccordionTrigger className="text-sm">Technicals</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="rsiMin" className="text-xs">RSI Min</Label>
                    <Input
                      id="rsiMin"
                      type="number"
                      placeholder="30"
                      min="0"
                      max="100"
                      value={filters.rsiMin || ''}
                      onChange={(e) => updateFilter('rsiMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rsiMax" className="text-xs">RSI Max</Label>
                    <Input
                      id="rsiMax"
                      type="number"
                      placeholder="70"
                      min="0"
                      max="100"
                      value={filters.rsiMax || ''}
                      onChange={(e) => updateFilter('rsiMax', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="week52Proximity" className="text-xs">52W High Proximity (%)</Label>
                  <Input
                    id="week52Proximity"
                    type="number"
                    placeholder="5"
                    step="0.1"
                    value={filters.week52Proximity || ''}
                    onChange={(e) => updateFilter('week52Proximity', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <Label htmlFor="vwapDistance" className="text-xs">Distance to VWAP (%)</Label>
                  <Input
                    id="vwapDistance"
                    type="number"
                    placeholder="2"
                    step="0.1"
                    value={filters.vwapDistance || ''}
                    onChange={(e) => updateFilter('vwapDistance', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <Label className="text-xs">MA Cross</Label>
                  <div className="space-y-2 mt-2">
                    {MA_CROSS_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={option.value}
                          checked={filters.maCross?.includes(option.value) || false}
                          onCheckedChange={(checked) => {
                            const current = filters.maCross || []
                            const updated = checked
                              ? [...current, option.value]
                              : current.filter(v => v !== option.value)
                            updateFilter('maCross', updated)
                          }}
                        />
                        <Label htmlFor={option.value} className="text-sm">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Options */}
          <AccordionItem value="options">
            <AccordionTrigger className="text-sm">Options</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="ivRankMin" className="text-xs">Min IV Rank</Label>
                  <Input
                    id="ivRankMin"
                    type="number"
                    placeholder="50"
                    min="0"
                    max="100"
                    value={filters.ivRankMin || ''}
                    onChange={(e) => updateFilter('ivRankMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <Label htmlFor="ivPercentileMin" className="text-xs">Min IV Percentile</Label>
                  <Input
                    id="ivPercentileMin"
                    type="number"
                    placeholder="70"
                    min="0"
                    max="100"
                    value={filters.ivPercentileMin || ''}
                    onChange={(e) => updateFilter('ivPercentileMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <Label htmlFor="oiMin" className="text-xs">Min Open Interest</Label>
                  <Input
                    id="oiMin"
                    type="number"
                    placeholder="100"
                    value={filters.oiMin || ''}
                    onChange={(e) => updateFilter('oiMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <Label htmlFor="oiVolRatio" className="text-xs">OI/Vol Ratio</Label>
                  <Input
                    id="oiVolRatio"
                    type="number"
                    placeholder="1.5"
                    step="0.1"
                    value={filters.oiVolRatio || ''}
                    onChange={(e) => updateFilter('oiVolRatio', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Delta Bucket</Label>
                  <div className="space-y-2 mt-2">
                    {DELTA_BUCKET_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={option.value}
                          checked={filters.deltaBucket?.includes(option.value) || false}
                          onCheckedChange={(checked) => {
                            const current = filters.deltaBucket || []
                            const updated = checked
                              ? [...current, option.value]
                              : current.filter(v => v !== option.value)
                            updateFilter('deltaBucket', updated)
                          }}
                        />
                        <Label htmlFor={option.value} className="text-sm">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="daysToExpiryMin" className="text-xs">Min DTE</Label>
                    <Input
                      id="daysToExpiryMin"
                      type="number"
                      placeholder="7"
                      value={filters.daysToExpiryMin || ''}
                      onChange={(e) => updateFilter('daysToExpiryMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="daysToExpiryMax" className="text-xs">Max DTE</Label>
                    <Input
                      id="daysToExpiryMax"
                      type="number"
                      placeholder="45"
                      value={filters.daysToExpiryMax || ''}
                      onChange={(e) => updateFilter('daysToExpiryMax', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Futures */}
          <AccordionItem value="futures">
            <AccordionTrigger className="text-sm">Futures</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Contract Root</Label>
                  <div className="space-y-2 mt-2">
                    {CONTRACT_ROOT_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={option.value}
                          checked={filters.contractRoot?.includes(option.value) || false}
                          onCheckedChange={(checked) => {
                            const current = filters.contractRoot || []
                            const updated = checked
                              ? [...current, option.value]
                              : current.filter(v => v !== option.value)
                            updateFilter('contractRoot', updated)
                          }}
                        />
                        <Label htmlFor={option.value} className="text-sm">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="sessionFilter" className="text-xs">Session</Label>
                  <Select
                    value={filters.sessionFilter || ''}
                    onValueChange={(value) => updateFilter('sessionFilter', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All sessions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sessions</SelectItem>
                      <SelectItem value="rth">Regular Trading Hours</SelectItem>
                      <SelectItem value="premarket">Pre-market</SelectItem>
                      <SelectItem value="afterhours">After Hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Sectors */}
          <AccordionItem value="sectors">
            <AccordionTrigger className="text-sm">Sectors</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {SECTOR_OPTIONS.map((sector) => (
                  <div key={sector} className="flex items-center space-x-2">
                    <Checkbox
                      id={sector}
                      checked={filters.sectors?.includes(sector) || false}
                      onCheckedChange={(checked) => {
                        const current = filters.sectors || []
                        const updated = checked
                          ? [...current, sector]
                          : current.filter(v => v !== sector)
                        updateFilter('sectors', updated)
                      }}
                    />
                    <Label htmlFor={sector} className="text-sm">
                      {sector}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Columns */}
          <AccordionItem value="columns">
            <AccordionTrigger className="text-sm">Columns</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {COLUMN_OPTIONS.map((column) => (
                  <div key={column.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={column.value}
                      checked={visibleColumns.includes(column.value)}
                      onCheckedChange={(checked) => {
                        const updated = checked
                          ? [...visibleColumns, column.value]
                          : visibleColumns.filter(v => v !== column.value)
                        onColumnsChange(updated)
                      }}
                    />
                    <Label htmlFor={column.value} className="text-sm">
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </ScrollArea>

      <Separator />

      {/* Watchlist Toggle */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="watchlistOnly"
          checked={filters.watchlistOnly || false}
          onCheckedChange={(checked) => updateFilter('watchlistOnly', checked)}
        />
        <Label htmlFor="watchlistOnly" className="text-sm">
          Only my watchlist symbols
        </Label>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button 
          onClick={handleApply} 
          disabled={isApplying}
          className="flex-1"
        >
          {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Apply
        </Button>
        <Button 
          variant="outline" 
          onClick={handleClear}
          className="flex-1"
        >
          Clear
        </Button>
      </div>
    </div>
  )
}
