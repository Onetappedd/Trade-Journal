'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { 
  Search, 
  Filter, 
  Save, 
  RotateCcw, 
  Star, 
  Plus, 
  MoreHorizontal,
  ChevronDown,
  Settings,
  Bookmark,
  TrendingUp,
  Zap,
  Target,
  ArrowUpDown,
  BarChart3
} from 'lucide-react'
import { ScannerFilters } from './ScannerFilters'
import { ScannerResults } from './ScannerResults'
import { ScannerDetails } from './ScannerDetails'
import { ScannerPresets } from './ScannerPresets'
import { SavedScansDropdown } from './SavedScansDropdown'
import { CommandPalette } from './CommandPalette'
import { useScannerState } from '@/hooks/useScannerState'
import { useSavedScans } from '@/hooks/useSavedScans'
import { useScannerData } from '@/hooks/useScannerData'
import { cn } from '@/lib/utils'

export function MarketScanner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  
  const {
    filters,
    setFilters,
    preset,
    setPreset,
    sortConfig,
    setSortConfig,
    visibleColumns,
    setVisibleColumns
  } = useScannerState()

  const { savedScans, saveScan, loadScan } = useSavedScans()
  const { usingRealData } = useScannerData(filters, preset)

  // Handle mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsCommandOpen(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSaveScan = async () => {
    const name = prompt('Enter scan name:')
    if (name) {
      await saveScan(name, {
        filters,
        preset,
        sortConfig,
        visibleColumns
      })
    }
  }

  const handleReset = () => {
    setFilters({})
    setPreset(null)
    setSortConfig([])
    setVisibleColumns(['symbol', 'name', 'price', 'change', 'volume'])
    setSelectedSymbol(null)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Desktop Only */}
      {!isMobile && (
        <div className="w-80 border-r bg-muted/30 flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold mb-4">Scanner</h2>
            <ScannerPresets 
              preset={preset} 
              onPresetChange={setPreset}
              onFiltersChange={setFilters}
            />
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <ScannerFilters 
              filters={filters}
              onFiltersChange={setFilters}
              sortConfig={sortConfig}
              onSortChange={setSortConfig}
              visibleColumns={visibleColumns}
              onColumnsChange={setVisibleColumns}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold">Market Scanner</h1>
              {preset && (
                <Badge variant="secondary" className="text-xs">
                  {preset}
                </Badge>
              )}
              <Badge 
                variant={usingRealData ? "default" : "outline"} 
                className="text-xs"
              >
                {usingRealData ? "Live Data" : "Demo Mode"}
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              {/* Mobile Filters Button */}
              {isMobile && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80">
                    <div className="space-y-4">
                      <ScannerPresets 
                        preset={preset} 
                        onPresetChange={setPreset}
                        onFiltersChange={setFilters}
                      />
                      <Separator />
                      <ScannerFilters 
                        filters={filters}
                        onFiltersChange={setFilters}
                        sortConfig={sortConfig}
                        onSortChange={setSortConfig}
                        visibleColumns={visibleColumns}
                        onColumnsChange={setVisibleColumns}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              )}

              {/* Saved Scans */}
              <SavedScansDropdown 
                savedScans={savedScans}
                onLoadScan={loadScan}
              />

              {/* Save Button */}
              <Button variant="outline" size="sm" onClick={handleSaveScan}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>

              {/* Reset Button */}
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>

              {/* Command Palette Trigger */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsCommandOpen(true)}
                className="hidden sm:flex"
              >
                <Search className="h-4 w-4 mr-2" />
                <span className="text-xs text-muted-foreground">⌘K</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Grid */}
        <div className="flex-1 flex">
          {/* Results Table */}
          <div className={cn(
            "flex-1 overflow-hidden",
            selectedSymbol && !isMobile ? "w-2/3" : "w-full"
          )}>
            <ScannerResults 
              filters={filters}
              preset={preset}
              sortConfig={sortConfig}
              visibleColumns={visibleColumns}
              selectedSymbol={selectedSymbol}
              onSymbolSelect={setSelectedSymbol}
            />
          </div>

          {/* Details Panel */}
          {selectedSymbol && !isMobile && (
            <div className="w-1/3 border-l bg-muted/30">
              <ScannerDetails 
                symbol={selectedSymbol}
                onClose={() => setSelectedSymbol(null)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette 
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onPresetChange={setPreset}
        onFiltersChange={setFilters}
        onSymbolSelect={setSelectedSymbol}
      />
    </div>
  )
}
