'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  Zap, 
  Target, 
  ArrowUpDown, 
  BarChart3,
  Activity,
  Flame,
  Gauge,
  TrendingDown,
  DollarSign,
  Star,
  Plus,
  ExternalLink
} from 'lucide-react'
import type { ScannerFilters } from '@/hooks/useScannerState'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onPresetChange: (preset: string | null) => void
  onFiltersChange: (filters: ScannerFilters) => void
  onSymbolSelect: (symbol: string) => void
}

const PRESETS = [
  { id: 'top-gainers', name: 'Top Gainers', icon: TrendingUp, description: 'Stocks up 3%+ with high volume' },
  { id: 'gap-ups', name: 'Gap Ups', icon: Zap, description: 'Premarket gaps 2%+' },
  { id: 'high-rvol', name: 'High RVOL', icon: Activity, description: 'Relative volume 2x+' },
  { id: 'week52-breakouts', name: '52-Week Breakouts', icon: Target, description: 'Near 52-week highs' },
  { id: 'pullback-20ema', name: 'Pullback to 20EMA', icon: ArrowUpDown, description: 'Price near 20EMA, RSI 40-60' },
  { id: 'oversold-reversal', name: 'Oversold Reversal', icon: TrendingDown, description: 'RSI ≤ 30, bullish close' },
  { id: 'high-iv-rank', name: 'High IV Rank', icon: Gauge, description: 'Options with IV Rank 70%+' },
  { id: 'oi-surge', name: 'OI Surge', icon: Flame, description: 'Open interest up 30%+' },
  { id: 'range-expansion', name: 'Range Expansion', icon: BarChart3, description: 'ATR% 3%+' },
  { id: 'vwap-reclaim', name: 'VWAP Reclaim', icon: DollarSign, description: 'Close above session VWAP' }
]

const FILTER_COMMANDS = [
  { id: 'price-above-20', name: 'Price > $20', filter: { priceMin: 20 } },
  { id: 'price-below-50', name: 'Price < $50', filter: { priceMax: 50 } },
  { id: 'volume-above-1m', name: 'Volume > 1M', filter: { volumeMin: 1000000 } },
  { id: 'rsi-below-30', name: 'RSI < 30', filter: { rsiMax: 30 } },
  { id: 'rsi-above-70', name: 'RSI > 70', filter: { rsiMin: 70 } },
  { id: 'change-above-5', name: '% Change > 5%', filter: { changeMin: 5 } },
  { id: 'change-below-neg5', name: '% Change < -5%', filter: { changeMax: -5 } },
  { id: 'atr-above-3', name: 'ATR% > 3%', filter: { atrPercentMin: 3 } }
]

const SYMBOL_COMMANDS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'NFLX', name: 'Netflix Inc.' },
  { symbol: 'AMD', name: 'Advanced Micro Devices Inc.' },
  { symbol: 'CRM', name: 'Salesforce Inc.' }
]

export function CommandPalette({
  isOpen,
  onClose,
  onPresetChange,
  onFiltersChange,
  onSymbolSelect
}: CommandPaletteProps) {
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (isOpen) {
      setSearch('')
    }
  }, [isOpen])

  const handlePresetSelect = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId)
    if (preset) {
      onPresetChange(presetId)
      onClose()
    }
  }

  const handleFilterSelect = (filter: Partial<ScannerFilters>) => {
    onFiltersChange(filter)
    onClose()
  }

  const handleSymbolSelect = (symbol: string) => {
    onSymbolSelect(symbol)
    onClose()
  }

  const filteredPresets = PRESETS.filter(preset =>
    preset.name.toLowerCase().includes(search.toLowerCase()) ||
    preset.description.toLowerCase().includes(search.toLowerCase())
  )

  const filteredFilters = FILTER_COMMANDS.filter(filter =>
    filter.name.toLowerCase().includes(search.toLowerCase())
  )

  const filteredSymbols = SYMBOL_COMMANDS.filter(symbol =>
    symbol.symbol.toLowerCase().includes(search.toLowerCase()) ||
    symbol.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 max-w-2xl">
        <Command>
          <CommandInput 
            placeholder="Search presets, filters, symbols..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            
            {/* Presets */}
            {filteredPresets.length > 0 && (
              <CommandGroup heading="Presets">
                {filteredPresets.map((preset) => {
                  const Icon = preset.icon
                  return (
                    <CommandItem
                      key={preset.id}
                      onSelect={() => handlePresetSelect(preset.id)}
                      className="flex items-center space-x-3"
                    >
                      <Icon className="h-4 w-4" />
                      <div className="flex-1">
                        <div className="font-medium">{preset.name}</div>
                        <div className="text-sm text-muted-foreground">{preset.description}</div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Preset
                      </Badge>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {/* Filters */}
            {filteredFilters.length > 0 && (
              <CommandGroup heading="Filters">
                {filteredFilters.map((filter) => (
                  <CommandItem
                    key={filter.id}
                    onSelect={() => handleFilterSelect(filter.filter)}
                    className="flex items-center space-x-3"
                  >
                    <div className="h-4 w-4 rounded border-2 border-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{filter.name}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Filter
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Symbols */}
            {filteredSymbols.length > 0 && (
              <CommandGroup heading="Symbols">
                {filteredSymbols.map((symbol) => (
                  <CommandItem
                    key={symbol.symbol}
                    onSelect={() => handleSymbolSelect(symbol.symbol)}
                    className="flex items-center space-x-3"
                  >
                    <div className="h-4 w-4 rounded-full bg-primary" />
                    <div className="flex-1">
                      <div className="font-medium">{symbol.symbol}</div>
                      <div className="text-sm text-muted-foreground">{symbol.name}</div>
                    </div>
                    <div className="flex space-x-1">
                      <Badge variant="outline" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Watch
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Plus className="h-3 w-3 mr-1" />
                        Trade
                      </Badge>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Quick Actions */}
            <CommandGroup heading="Quick Actions">
              <CommandItem onSelect={() => onClose()}>
                <ExternalLink className="h-4 w-4 mr-3" />
                <div className="flex-1">
                  <div className="font-medium">Open Advanced Chart</div>
                  <div className="text-sm text-muted-foreground">View detailed chart analysis</div>
                </div>
              </CommandItem>
              <CommandItem onSelect={() => onClose()}>
                <Plus className="h-4 w-4 mr-3" />
                <div className="flex-1">
                  <div className="font-medium">Create New Trade</div>
                  <div className="text-sm text-muted-foreground">Add a new trade entry</div>
                </div>
              </CommandItem>
              <CommandItem onSelect={() => onClose()}>
                <Star className="h-4 w-4 mr-3" />
                <div className="flex-1">
                  <div className="font-medium">Add to Watchlist</div>
                  <div className="text-sm text-muted-foreground">Track selected symbol</div>
                </div>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
