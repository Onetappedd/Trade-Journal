'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers/auth-provider';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Play,
  RefreshCw,
  BarChart3,
  DollarSign,
  Percent,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface MonteCarloResult {
  summary: Array<{
    tradeIndex: number;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  }>;
  samplePaths: Array<Array<{
    tradeIndex: number;
    equity: number;
  }>>;
  ruinProbability: number;
  endEquityDistribution: number[];
}

interface MonteCarloStats {
  mode: string;
  numTrades: number;
  iterations: number;
  riskPct: number;
  startEquity: number;
  winRate?: number;
  avgWinR?: number;
  avgLossR?: number;
  sampleSize?: number;
}

export default function MonteCarloSimulator() {
  const { session } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const [stats, setStats] = useState<MonteCarloStats | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPercentage, setShowPercentage] = useState(false); // Toggle for $ vs %

  // Parametric mode controls
  const [winRate, setWinRate] = useState(50); // 0-100
  const [avgWinR, setAvgWinR] = useState(2.0);
  const [avgLossR, setAvgLossR] = useState(-1.0);
  const [riskPct, setRiskPct] = useState(1.0);
  const [numTrades, setNumTrades] = useState(500);
  const [iterations, setIterations] = useState(1000);
  const [startEquity, setStartEquity] = useState(10000);

  // Run simulation with user's stats (bootstrap mode)
  const runWithMyStats = async () => {
    if (!session) return;

    setIsLoading(true);
    setHasError(false);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/analytics/monte-carlo-trades', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'profileDefaults',
          numTrades,
          iterations,
          riskPct,
          startEquity,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setHasError(true);
        setErrorMessage(errorData.details || 'Failed to run simulation');
        return;
      }

      const data = await response.json();
      setResult(data.result);
      setStats(data.stats);
      setIsExpanded(true);
    } catch (error: any) {
      setHasError(true);
      setErrorMessage(error.message || 'Failed to run simulation');
    } finally {
      setIsLoading(false);
    }
  };

  // Run simulation with parametric mode
  const runParametric = async () => {
    if (!session) return;

    setIsLoading(true);
    setHasError(false);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/analytics/monte-carlo-trades', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'parametric',
          numTrades,
          iterations,
          riskPct,
          startEquity,
          winRate: winRate / 100, // Convert to 0-1
          avgWinR,
          avgLossR,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setHasError(true);
        setErrorMessage(errorData.details || 'Failed to run simulation');
        return;
      }

      const data = await response.json();
      setResult(data.result);
      setStats(data.stats);
      setIsExpanded(true);
    } catch (error: any) {
      setHasError(true);
      setErrorMessage(error.message || 'Failed to run simulation');
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Calculate percentage change
  const calculatePercentChange = (current: number, start: number) => {
    if (start === 0) return 0;
    return ((current - start) / start) * 100;
  };

  if (!isExpanded) {
    return (
      <Card className="bg-slate-900/50 border-slate-800/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Future Wealth Simulator</h3>
              <p className="text-sm text-slate-400">
                Simulate your future performance based on your last {stats?.sampleSize || 'N'} trades
              </p>
            </div>
            <Button
              onClick={runWithMyStats}
              disabled={isLoading || !session}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Simulate My Performance
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const medianFinalEquity = result?.summary[result.summary.length - 1]?.p50 || 0;
  const p10FinalEquity = result?.summary[result.summary.length - 1]?.p10 || 0;
  const ruinProb = (result?.ruinProbability || 0) * 100;
  const profitablePaths = result?.endEquityDistribution.filter(e => e > (stats?.startEquity || 0)).length || 0;
  const profitablePercent = result ? (profitablePaths / result.endEquityDistribution.length) * 100 : 0;

  // Get the actual starting equity from stats (used for percentage calculations)
  const actualStartEquity = stats?.startEquity || 10000;

  // Prepare chart data with $ or % transformation
  const chartData = result?.summary.map(point => {
    if (showPercentage) {
      return {
        tradeIndex: point.tradeIndex,
        p10: calculatePercentChange(point.p10, actualStartEquity),
        p25: calculatePercentChange(point.p25, actualStartEquity),
        p50: calculatePercentChange(point.p50, actualStartEquity),
        p75: calculatePercentChange(point.p75, actualStartEquity),
        p90: calculatePercentChange(point.p90, actualStartEquity),
      };
    } else {
      return {
        tradeIndex: point.tradeIndex,
        p10: point.p10,
        p25: point.p25,
        p50: point.p50,
        p75: point.p75,
        p90: point.p90,
      };
    }
  }) || [];

  // Merge all paths into chart data for visualization
  // Transform to percentage if needed
  const mergedChartDataWithPaths = chartData.map((point, idx) => {
    const merged: any = { ...point };
    
    // Add all path values at this trade index
    result?.samplePaths.forEach((path, pathIdx) => {
      if (path[idx]) {
        const pathValue = showPercentage 
          ? calculatePercentChange(path[idx].equity, actualStartEquity)
          : path[idx].equity;
        merged[`path${pathIdx}`] = pathValue;
      }
    });
    
    return merged;
  });

  return (
    <Card className="bg-slate-900/50 border-slate-800/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-white">Future Wealth Simulator</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="text-slate-400 hover:text-white"
          >
            Collapse
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasError && (
          <div className="bg-red-950/50 border border-red-800/50 rounded-lg p-4 flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium">Simulation Error</p>
              <p className="text-red-300 text-sm mt-1">{errorMessage}</p>
            </div>
          </div>
        )}

        {result && stats && (
          <>
            {/* Chart */}
            <div className="h-96 bg-slate-800/30 rounded-lg border border-slate-700/50 p-4">
              <div className="flex items-center justify-end mb-2">
                <div className="flex items-center space-x-1 bg-slate-800/50 rounded-lg p-1">
                  <Button
                    size="sm"
                    variant={!showPercentage ? "default" : "ghost"}
                    onClick={() => setShowPercentage(false)}
                    className={`h-7 px-2 text-xs ${!showPercentage ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"}`}
                  >
                    <DollarSign className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={showPercentage ? "default" : "ghost"}
                    onClick={() => setShowPercentage(true)}
                    className={`h-7 px-2 text-xs ${showPercentage ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"}`}
                  >
                    <Percent className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mergedChartDataWithPaths}>
                  <defs>
                    <linearGradient id="colorP10P90" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorP25P75" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis
                    dataKey="tradeIndex"
                    stroke="#94a3b8"
                    style={{ fontSize: '12px' }}
                    tick={{ fill: '#94a3b8' }}
                    label={{ value: 'Trade Number', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    style={{ fontSize: '12px' }}
                    tick={{ fill: '#94a3b8' }}
                    tickFormatter={(value) => showPercentage 
                      ? `${value.toFixed(1)}%` 
                      : formatCurrency(value)
                    }
                    label={{ 
                      value: showPercentage ? 'Equity (%)' : 'Equity ($)', 
                      angle: -90, 
                      position: 'insideLeft', 
                      fill: '#94a3b8' 
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                    }}
                    formatter={(value: number) => showPercentage 
                      ? `${value.toFixed(2)}%` 
                      : formatCurrency(value)
                    }
                    labelFormatter={(label) => `Trade ${label}`}
                  />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
                  
                  {/* 10-90 percentile band */}
                  <Area
                    type="monotone"
                    dataKey="p90"
                    stackId="1"
                    stroke="none"
                    fill="url(#colorP10P90)"
                    fillOpacity={0.1}
                  />
                  <Area
                    type="monotone"
                    dataKey="p10"
                    stackId="1"
                    stroke="none"
                    fill="#1e293b"
                  />
                  
                  {/* 25-75 percentile band */}
                  <Area
                    type="monotone"
                    dataKey="p75"
                    stackId="2"
                    stroke="none"
                    fill="url(#colorP25P75)"
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="p25"
                    stackId="2"
                    stroke="none"
                    fill="#1e293b"
                  />
                  
                  {/* Median line */}
                  <Line
                    type="monotone"
                    dataKey="p50"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={false}
                    name="Median (50th percentile)"
                  />
                  
                  {/* All wealth paths - rendered with very low opacity to form a "cloud" effect */}
                  {result?.samplePaths.map((_, idx) => (
                    <Line
                      key={`allpath${idx}`}
                      type="monotone"
                      dataKey={`path${idx}`}
                      stroke="#64748b"
                      strokeWidth={0.5}
                      dot={false}
                      isAnimationActive={false} // Disable animation for performance with many paths
                      connectNulls={false}
                      strokeOpacity={0.08} // Very low opacity so paths form a cloud
                      hide={true} // Hide from legend - paths are shown as a visual cloud, not individual legend entries
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Most Likely Balance</p>
                      <p className="text-xl font-bold text-emerald-400">
                        {formatCurrency(medianFinalEquity)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatPercent(calculatePercentChange(medianFinalEquity, stats.startEquity))}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-emerald-400/50" />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    In 50% of simulations, you ended with at least this amount.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Unlucky Scenario</p>
                      <p className="text-xl font-bold text-red-400">
                        {formatCurrency(p10FinalEquity)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatPercent(calculatePercentChange(p10FinalEquity, stats.startEquity))}
                      </p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-red-400/50" />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    In 10% of simulations, you did worse than this.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Risk of Ruin</p>
                      <p className="text-xl font-bold text-orange-400">
                        {ruinProb.toFixed(1)}%
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-orange-400/50" />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Chance of hitting 50% drawdown or worse.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Profitable Paths</p>
                      <p className="text-xl font-bold text-white">
                        {profitablePercent.toFixed(1)}%
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-blue-400/50" />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {profitablePaths} of {result.endEquityDistribution.length} paths ended profitable.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Adjust Assumptions Panel */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-800">
                  {showAdvanced ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Hide Assumptions
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Adjust Assumptions
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-white">Your Edge</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="winRate" className="text-slate-300">
                        Win Rate: {winRate}%
                      </Label>
                      <Slider
                        id="winRate"
                        min={0}
                        max={100}
                        step={1}
                        value={[winRate]}
                        onValueChange={([value]) => setWinRate(value)}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="avgWinR" className="text-slate-300">
                        Avg Win R: {avgWinR.toFixed(2)}
                      </Label>
                      <Input
                        id="avgWinR"
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="10"
                        value={avgWinR}
                        onChange={(e) => setAvgWinR(parseFloat(e.target.value) || 0)}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="avgLossR" className="text-slate-300">
                        Avg Loss R: {avgLossR.toFixed(2)}
                      </Label>
                      <Input
                        id="avgLossR"
                        type="number"
                        step="0.1"
                        min="-10"
                        max="-0.1"
                        value={avgLossR}
                        onChange={(e) => setAvgLossR(parseFloat(e.target.value) || 0)}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-white">Risk Management</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="riskPct" className="text-slate-300">
                        Risk per Trade: {riskPct}% of equity
                      </Label>
                      <Slider
                        id="riskPct"
                        min={0.25}
                        max={5}
                        step={0.25}
                        value={[riskPct]}
                        onValueChange={([value]) => setRiskPct(value)}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="numTrades" className="text-slate-300">
                        Number of Trades: {numTrades}
                      </Label>
                      <Input
                        id="numTrades"
                        type="number"
                        min="10"
                        max="10000"
                        step="10"
                        value={numTrades}
                        onChange={(e) => setNumTrades(parseInt(e.target.value) || 500)}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="startEquity" className="text-slate-300">
                        Starting Equity: ${startEquity.toLocaleString()}
                      </Label>
                      <Input
                        id="startEquity"
                        type="number"
                        min="1000"
                        max="1000000"
                        step="1000"
                        value={startEquity}
                        onChange={(e) => setStartEquity(parseInt(e.target.value) || 10000)}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={runWithMyStats}
                    disabled={isLoading}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    Use My Stats
                  </Button>
                  <Button
                    onClick={runParametric}
                    disabled={isLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Simulation
                      </>
                    )}
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </CardContent>
    </Card>
  );
}

