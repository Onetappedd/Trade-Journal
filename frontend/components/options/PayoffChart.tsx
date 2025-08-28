'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { TrendingUp, TrendingDown, Maximize2, Minimize2 } from 'lucide-react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea
} from 'recharts'
import { CalculatorState, CalculatorResults } from './OptionsCalculator'
import { priceBS, daysToYears } from '@/lib/options/blackscholes'
import { priceAmerican } from '@/lib/options/american'
import { formatCurrency } from '@/lib/options/format'

interface PayoffChartProps {
  state: CalculatorState
  results: CalculatorResults
  showPnl: boolean
  onTogglePnl: (showPnl: boolean) => void
}

interface ChartPoint {
  underlyingPrice: number
  todayValue: number
  expirationValue: number
  todayPnl: number
  expirationPnl: number
}

export function PayoffChart({
  state,
  results,
  showPnl,
  onTogglePnl
}: PayoffChartProps) {
  const [hoveredPrice, setHoveredPrice] = useState<number | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  // Generate chart data with realistic scaling
  const chartData = useMemo((): ChartPoint[] => {
    const range = 0.3 // ±30% around current price for more realistic view
    const minPrice = Math.max(0, state.S * (1 - range))
    const maxPrice = state.S * (1 + range)
    const points = 100

    const data: ChartPoint[] = []
    
    for (let i = 0; i <= points; i++) {
      const underlyingPrice = minPrice + (maxPrice - minPrice) * (i / points)
      
      // Calculate option value at this underlying price
      const T = daysToYears(state.DTE)
      const inputs = {
        S: underlyingPrice,
        K: state.K,
        T,
        iv: state.iv,
        r: state.r,
        q: state.q,
        type: state.type
      }

      const todayValue = state.method === 'bs' 
        ? priceBS(inputs)
        : priceAmerican(inputs)

      // Calculate expiration value (intrinsic value)
      const expirationValue = state.type === 'call'
        ? Math.max(underlyingPrice - state.K, 0)
        : Math.max(state.K - underlyingPrice, 0)

      // Calculate P&L (assuming we bought at current theoretical price)
      const todayPnl = (todayValue - results.price) * state.multiplier
      const expirationPnl = (expirationValue - results.price) * state.multiplier

      data.push({
        underlyingPrice,
        todayValue: todayValue * state.multiplier,
        expirationValue: expirationValue * state.multiplier,
        todayPnl,
        expirationPnl
      })
    }

    return data
  }, [state, results])

  // Find breakeven point
  const breakevenPoint = useMemo(() => {
    return chartData.find(point => 
      Math.abs(point.expirationPnl) < 0.01
    )?.underlyingPrice || results.breakeven
  }, [chartData, results.breakeven])

  // Calculate realistic Y-axis bounds for better scaling
  const yAxisBounds = useMemo(() => {
    const values = chartData.flatMap(point => [
      showPnl ? point.todayPnl : point.todayValue,
      showPnl ? point.expirationPnl : point.expirationValue
    ])
    
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min
    
    // Add 10% padding and ensure reasonable bounds
    const padding = range * 0.1
    const minBound = Math.min(min - padding, -results.price * state.multiplier * 0.5)
    const maxBound = Math.max(max + padding, results.price * state.multiplier * 2)
    
    return { min: minBound, max: maxBound }
  }, [chartData, showPnl, results.price, state.multiplier])

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartPoint
      
      return (
        <Card className="p-3 shadow-lg">
          <div className="space-y-2">
            <div className="font-medium">
              Underlying: {formatCurrency(data.underlyingPrice)}
            </div>
            <div className="text-sm">
              <div className="flex justify-between">
                <span>Today:</span>
                <span className={data.todayPnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {showPnl ? formatCurrency(data.todayPnl) : formatCurrency(data.todayValue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Expiration:</span>
                <span className={data.expirationPnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {showPnl ? formatCurrency(data.expirationPnl) : formatCurrency(data.expirationValue)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      {/* Chart Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Label htmlFor="pnl-mode" className="text-sm">
            P&L Mode
          </Label>
          <Switch
            id="pnl-mode"
            checked={showPnl}
            onCheckedChange={onTogglePnl}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          {state.type === 'call' ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
          <span className="text-sm font-medium">
            {state.type.toUpperCase()} {state.K}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-2"
        >
          {isExpanded ? (
            <>
              <Minimize2 className="h-4 w-4 mr-1" />
              Minimize
            </>
          ) : (
            <>
              <Maximize2 className="h-4 w-4 mr-1" />
              Enlarge
            </>
          )}
        </Button>
      </div>

      {/* Chart */}
      <div className={isExpanded ? "h-96" : "h-80"}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="underlyingPrice" 
              tickFormatter={(value) => formatCurrency(value)}
              stroke="#6B7280"
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value)}
              stroke="#6B7280"
              domain={[yAxisBounds.min, yAxisBounds.max]}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Zero line */}
            <ReferenceLine y={0} stroke="#6B7280" strokeDasharray="3 3" />
            
            {/* Current price line */}
            <ReferenceLine 
              x={state.S} 
              stroke="#3B82F6" 
              strokeDasharray="3 3"
              label={{ value: 'Current', position: 'top' }}
            />
            
            {/* Breakeven line */}
            {breakevenPoint && (
              <ReferenceLine 
                x={breakevenPoint} 
                stroke="#10B981" 
                strokeDasharray="3 3"
                label={{ value: 'Breakeven', position: 'bottom' }}
              />
            )}
            
            {/* Strike line */}
            <ReferenceLine 
              x={state.K} 
              stroke="#F59E0B" 
              strokeDasharray="3 3"
              label={{ value: 'Strike', position: 'bottom' }}
            />

            {/* Today's value line */}
            <Line
              type="monotone"
              dataKey={showPnl ? "todayPnl" : "todayValue"}
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              name="Today"
            />
            
            {/* Expiration value line */}
            <Line
              type="monotone"
              dataKey={showPnl ? "expirationPnl" : "expirationValue"}
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              name="At Expiration"
            />

            {/* Fill areas for P&L mode */}
            {showPnl && (
              <>
                <ReferenceArea
                  y1={0}
                  y2="dataMax"
                  fill="#10B981"
                  fillOpacity={0.1}
                />
                <ReferenceArea
                  y1="dataMin"
                  y2={0}
                  fill="#EF4444"
                  fillOpacity={0.1}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Legend */}
      <div className="flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-blue-500"></div>
          <span>Today</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-green-500"></div>
          <span>At Expiration</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-blue-500 border-dashed"></div>
          <span>Current Price</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-yellow-500 border-dashed"></div>
          <span>Strike</span>
        </div>
      </div>

      {/* Key Points */}
      <Card>
        <CardContent className="pt-4">
          <h4 className="text-sm font-medium mb-3">Key Points</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Current Price:</span>
              <div className="font-medium">{formatCurrency(state.S)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Strike Price:</span>
              <div className="font-medium">{formatCurrency(state.K)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Breakeven:</span>
              <div className="font-medium">{formatCurrency(results.breakeven)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Max Loss:</span>
              <div className="font-medium text-red-600">
                {formatCurrency(-results.price * state.multiplier)}
              </div>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Max Gain:</span>
              <div className="font-medium text-green-600">
                {state.type === 'call' ? 'Unlimited' : formatCurrency((state.K - results.price) * state.multiplier)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
