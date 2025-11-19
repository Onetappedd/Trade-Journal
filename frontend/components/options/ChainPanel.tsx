'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Search, 
  RefreshCw, 
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { formatStrike, formatOptionPrice, formatVolume, formatExpiration, formatOptionType, formatMoneyness } from '@/lib/options/format'
import { CalculatorState } from './OptionsCalculator'

interface ChainPanelProps {
  onContractSelect: (contract: any) => void
  selectedSymbol?: string
  selectedExpiry?: string
  selectedStrike?: number
  selectedType?: 'call' | 'put'
}

export function ChainPanel({
  onContractSelect,
  selectedSymbol,
  selectedExpiry,
  selectedStrike,
  selectedType
}: ChainPanelProps) {
  const [symbol, setSymbol] = useState(selectedSymbol || '')
  const [chain, setChain] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch options chain
  const fetchChain = async () => {
    if (!symbol) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/market/chain?symbol=${symbol.toUpperCase()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch options chain')
      }

      setChain(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch options chain')
    } finally {
      setLoading(false)
    }
  }

  // Fetch chain when symbol changes
  useEffect(() => {
    if (symbol) {
      fetchChain()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol])

  // Filter options based on search
  const filteredCalls = chain?.calls?.filter((option: any) => 
    option.strike.toString().includes(searchTerm) ||
    formatExpiration(option.expiry).includes(searchTerm)
  ) || []

  const filteredPuts = chain?.puts?.filter((option: any) => 
    option.strike.toString().includes(searchTerm) ||
    formatExpiration(option.expiry).includes(searchTerm)
  ) || []

  // Virtualization setup
  const callsVirtualizer = useVirtualizer({
    count: filteredCalls.length,
    getScrollElement: () => document.getElementById('calls-table'),
    estimateSize: () => 40,
    overscan: 5,
  })

  const putsVirtualizer = useVirtualizer({
    count: filteredPuts.length,
    getScrollElement: () => document.getElementById('puts-table'),
    estimateSize: () => 40,
    overscan: 5,
  })

  const handleContractClick = (contract: any) => {
    onContractSelect({
      ...contract,
      underlyingPrice: chain?.underlyingPrice
    })
  }

  const isSelected = (contract: any) => {
    return contract.strike === selectedStrike && 
           contract.type === selectedType &&
           contract.expiry === selectedExpiry
  }

  return (
    <div className="space-y-4">
      {/* Symbol Input */}
      <div className="flex space-x-2">
        <Input
          placeholder="Enter symbol (e.g., AAPL)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && fetchChain()}
        />
        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchChain}
          disabled={!symbol || loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}

      {/* Chain Data */}
      {chain && !loading && (
        <div className="space-y-4">
          {/* Underlying Info */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <span className="font-medium">{chain.symbol}</span>
              <span className="text-muted-foreground ml-2">
                ${chain.underlyingPrice?.toFixed(2)}
              </span>
            </div>
            <Badge variant="outline">
              {chain.expirations?.length || 0} expirations
            </Badge>
          </div>

          {/* Expiration Select */}
          {chain.expirations && chain.expirations.length > 0 && (
            <Select 
              value={selectedExpiry || chain.expirations[0]} 
              onValueChange={(value) => {
                // Refetch chain with new expiry
                fetchChain()
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select expiration" />
              </SelectTrigger>
              <SelectContent>
                {chain.expirations.map((expiry: string) => (
                  <SelectItem key={expiry} value={expiry}>
                    {formatExpiration(expiry)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Search */}
          <Input
            placeholder="Search strikes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />

          {/* Options Tabs */}
          <Tabs defaultValue="calls" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="calls" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span>Calls ({filteredCalls.length})</span>
              </TabsTrigger>
              <TabsTrigger value="puts" className="flex items-center space-x-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span>Puts ({filteredPuts.length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calls" className="mt-4">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Strike</TableHead>
                      <TableHead className="w-20">Bid</TableHead>
                      <TableHead className="w-20">Ask</TableHead>
                      <TableHead className="w-20">Last</TableHead>
                      <TableHead className="w-16">Vol</TableHead>
                      <TableHead className="w-16">OI</TableHead>
                      <TableHead className="w-16">IV</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {callsVirtualizer.getVirtualItems().map((virtualRow) => {
                      const option = filteredCalls[virtualRow.index]
                      const selected = isSelected(option)
                      const moneyness = chain.underlyingPrice / option.strike
                      
                      return (
                        <TableRow
                          key={option.strike}
                          className={`cursor-pointer hover:bg-muted/50 ${
                            selected ? 'bg-primary/10 border-primary' : ''
                          }`}
                          onClick={() => handleContractClick(option)}
                          style={{
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                        >
                          <TableCell className="font-medium">
                            {formatStrike(option.strike)}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {option.bid ? `$${option.bid.toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {option.ask ? `$${option.ask.toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {option.last ? `$${option.last.toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell className="tabular-nums text-xs">
                            {formatVolume(option.volume)}
                          </TableCell>
                          <TableCell className="tabular-nums text-xs">
                            {formatVolume(option.openInterest)}
                          </TableCell>
                          <TableCell className="tabular-nums text-xs">
                            {option.impliedVolatility 
                              ? `${(option.impliedVolatility * 100).toFixed(1)}%`
                              : '-'
                            }
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="puts" className="mt-4">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Strike</TableHead>
                      <TableHead className="w-20">Bid</TableHead>
                      <TableHead className="w-20">Ask</TableHead>
                      <TableHead className="w-20">Last</TableHead>
                      <TableHead className="w-16">Vol</TableHead>
                      <TableHead className="w-16">OI</TableHead>
                      <TableHead className="w-16">IV</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {putsVirtualizer.getVirtualItems().map((virtualRow) => {
                      const option = filteredPuts[virtualRow.index]
                      const selected = isSelected(option)
                      const moneyness = chain.underlyingPrice / option.strike
                      
                      return (
                        <TableRow
                          key={option.strike}
                          className={`cursor-pointer hover:bg-muted/50 ${
                            selected ? 'bg-primary/10 border-primary' : ''
                          }`}
                          onClick={() => handleContractClick(option)}
                          style={{
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                        >
                          <TableCell className="font-medium">
                            {formatStrike(option.strike)}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {option.bid ? `$${option.bid.toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {option.ask ? `$${option.ask.toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {option.last ? `$${option.last.toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell className="tabular-nums text-xs">
                            {formatVolume(option.volume)}
                          </TableCell>
                          <TableCell className="tabular-nums text-xs">
                            {formatVolume(option.openInterest)}
                          </TableCell>
                          <TableCell className="tabular-nums text-xs">
                            {option.impliedVolatility 
                              ? `${(option.impliedVolatility * 100).toFixed(1)}%`
                              : '-'
                            }
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Empty State */}
      {!chain && !loading && !error && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Enter a symbol to load options chain</p>
        </div>
      )}
    </div>
  )
}
