'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  DollarSign
} from 'lucide-react'
import type { ScannerFilters } from '@/hooks/useScannerState'

interface ScannerPresetsProps {
  preset: string | null
  onPresetChange: (preset: string | null) => void
  onFiltersChange: (filters: ScannerFilters) => void
}

const PRESETS = [
  {
    id: 'top-gainers',
    name: 'Top Gainers',
    description: 'Stocks up 3%+ with high volume',
    icon: TrendingUp,
    filters: {
      universe: ['stocks'],
      changeMin: 3,
      volumeMin: 1000000
    }
  },
  {
    id: 'gap-ups',
    name: 'Gap Ups',
    description: 'Premarket gaps 2%+',
    icon: Zap,
    filters: {
      universe: ['stocks'],
      changeMin: 2,
      volumeMin: 500000
    }
  },
  {
    id: 'high-rvol',
    name: 'High RVOL',
    description: 'Relative volume 2x+',
    icon: Activity,
    filters: {
      universe: ['stocks'],
      rvolMin: 2,
      volumeMin: 100000
    }
  },
  {
    id: 'week52-breakouts',
    name: '52-Week Breakouts',
    description: 'Near 52-week highs',
    icon: Target,
    filters: {
      universe: ['stocks'],
      week52Proximity: 1,
      volumeMin: 500000
    }
  },
  {
    id: 'pullback-20ema',
    name: 'Pullback to 20EMA',
    description: 'Price near 20EMA, RSI 40-60',
    icon: ArrowUpDown,
    filters: {
      universe: ['stocks'],
      rsiMin: 40,
      rsiMax: 60,
      volumeMin: 300000
    }
  },
  {
    id: 'oversold-reversal',
    name: 'Oversold Reversal',
    description: 'RSI ≤ 30, bullish close',
    icon: TrendingDown,
    filters: {
      universe: ['stocks'],
      rsiMax: 30,
      changeMin: 0.5,
      volumeMin: 200000
    }
  },
  {
    id: 'high-iv-rank',
    name: 'High IV Rank',
    description: 'Options with IV Rank 70%+',
    icon: Gauge,
    filters: {
      universe: ['options'],
      ivRankMin: 70,
      volumeMin: 100
    }
  },
  {
    id: 'oi-surge',
    name: 'OI Surge',
    description: 'Open interest up 30%+',
    icon: Flame,
    filters: {
      universe: ['options'],
      oiVolRatio: 1.3,
      volumeMin: 50
    }
  },
  {
    id: 'range-expansion',
    name: 'Range Expansion',
    description: 'ATR% 3%+',
    icon: BarChart3,
    filters: {
      universe: ['futures', 'crypto'],
      atrPercentMin: 3,
      volumeMin: 1000
    }
  },
  {
    id: 'vwap-reclaim',
    name: 'VWAP Reclaim',
    description: 'Close above session VWAP',
    icon: DollarSign,
    filters: {
      universe: ['futures', 'crypto'],
      vwapDistance: 0.5,
      volumeMin: 500
    }
  }
]

export function ScannerPresets({ preset, onPresetChange, onFiltersChange }: ScannerPresetsProps) {
  const handlePresetClick = (presetId: string) => {
    const selectedPreset = PRESETS.find(p => p.id === presetId)
    if (selectedPreset) {
      onPresetChange(presetId)
      onFiltersChange(selectedPreset.filters)
    }
  }

  const handleClearPreset = () => {
    onPresetChange(null)
    onFiltersChange({})
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Presets</h3>
        {preset && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearPreset}
            className="h-6 px-2 text-xs"
          >
            Clear
          </Button>
        )}
      </div>

      <ScrollArea className="h-64">
        <div className="space-y-2">
          {PRESETS.map((presetItem) => {
            const Icon = presetItem.icon
            const isActive = preset === presetItem.id
            
            return (
              <Button
                key={presetItem.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className="w-full justify-start h-auto p-3"
                onClick={() => handlePresetClick(presetItem.id)}
              >
                <div className="flex items-start space-x-3 w-full">
                  <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{presetItem.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {presetItem.description}
                    </div>
                  </div>
                  {isActive && (
                    <Badge variant="secondary" className="text-xs">
                      Active
                    </Badge>
                  )}
                </div>
              </Button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
