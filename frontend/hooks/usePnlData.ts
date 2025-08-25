'use client';

import { useMemo } from 'react';
import { mapTrades, type NormalizedTrade, isTradeClosed, getTradeDate, getTradeRealizedPnl, getTradeMultiplier } from '@/lib/trade-mapper';
import { filterDataByRange, type TimeRange } from '@/components/charts/RangeFilter';
import { useUrlParams } from '@/hooks/useUrlParams';

export interface PnlDataPoint {
  date: string;
  value: number;
}

export interface PnlSummary {
  totalPnl: number;
  realizedPnl: number;
  unrealizedPnl: number;
  change: number;
  totalTrades: number;
  closedTrades: number;
  openTrades: number;
}

export interface PnlDataResult {
  // Raw data
  allData: PnlDataPoint[];
  filteredData: PnlDataPoint[];
  
  // Mode and fallback info
  mode: 'realized' | 'total';
  fallbackUsed: boolean;
  
  // Summary statistics
  summary: PnlSummary;
  
  // Counts for UI
  totalDataPoints: number;
  filteredDataPoints: number;
  
  // Current range
  currentRange: TimeRange;
}

// Generic trade interface that works with both Dashboard and Analytics
export interface GenericTrade {
  id: string;
  symbol: string;
  side: string;
  quantity: number;
  entry_price: number | null;
  entry_date: string;
  exit_price?: number | null;
  exit_date?: string | null;
  status?: string;
  asset_type?: string;
  multiplier?: number | null;
  underlying?: string | null;
  option_type?: string | null;
  strike_price?: number | null;
  expiration_date?: string | null;
  fees?: number | null;
  pnl?: number | null;
  mark_price?: number | null;
  last_price?: number | null;
}

// Calculate P&L for a single trade using normalized data
function calculateTradePnl(trade: NormalizedTrade): number {
  // If we have a pre-calculated P&L value, use it (this should match the position tracker)
  if (trade.pnl !== null && trade.pnl !== undefined) {
    return trade.pnl;
  }

  // Otherwise, calculate from entry/exit prices if available
  if (trade.exit_price !== null && trade.entry_price !== null) {
    const quantity = trade.quantity;
    const entryPrice = trade.entry_price;
    const exitPrice = trade.exit_price;
    const fees = trade.fees || 0;
    const multiplier = getTradeMultiplier(trade);

    let pnl = 0;
    if (trade.side === 'buy') {
      pnl = (exitPrice - entryPrice) * quantity * multiplier - fees;
    } else {
      pnl = (entryPrice - exitPrice) * quantity * multiplier - fees;
    }
    
    return pnl;
  }
  
  return 0;
}

// Build cumulative P&L series from trades (REALIZED mode by default)
function buildPnlSeries(trades: GenericTrade[]): { series: PnlDataPoint[], mode: 'realized' | 'total', fallbackUsed: boolean } {
  if (!trades || trades.length === 0) return { series: [], mode: 'realized', fallbackUsed: false };

  // Normalize trades using the mapper
  const normalizedTrades = mapTrades(trades);

  // Default to REALIZED mode - only include closed trades with realized P&L
  const realizedTrades = normalizedTrades.filter(trade => {
    // Include trades with pre-calculated P&L
    if (trade.pnl !== null && trade.pnl !== undefined) return true;
    // Include closed trades that we can calculate realized P&L for
    if (isTradeClosed(trade) && trade.entry_price) return true;
    return false;
  });

  // Build realized series
  const realizedSeries = buildSeriesFromTrades(realizedTrades, 'realized');
  
  // If we have realized P&L data, return it
  if (realizedSeries.length > 0) {
    return { series: realizedSeries, mode: 'realized', fallbackUsed: false };
  }

  // Fallback: Try TOTAL mode (include unrealized P&L from open positions)
  const totalTrades = normalizedTrades.filter(trade => {
    // Include all trades with any P&L data
    if (trade.pnl !== null && trade.pnl !== undefined) return true;
    // Include closed trades
    if (isTradeClosed(trade) && trade.entry_price) return true;
    // Include open trades with current prices
    if (!isTradeClosed(trade) && trade.entry_price && (trade.mark_price || trade.last_price)) return true;
    return false;
  });

  const totalSeries = buildSeriesFromTrades(totalTrades, 'total');
  
  if (totalSeries.length > 0) {
    return { series: totalSeries, mode: 'total', fallbackUsed: true };
  }

  // No P&L data available
  return { series: [], mode: 'realized', fallbackUsed: false };
}

// Helper function to build series from filtered trades
function buildSeriesFromTrades(trades: NormalizedTrade[], mode: 'realized' | 'total'): PnlDataPoint[] {
  if (trades.length === 0) return [];

  // Sort by date (use exit_date for closed trades, entry_date for open trades)
  const sortedTrades = trades.sort((a, b) => {
    const dateA = getTradeDate(a);
    const dateB = getTradeDate(b);
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });

  // Group trades by date and calculate daily P&L
  const dailyPnl = new Map<string, number>();
  
  sortedTrades.forEach(trade => {
    const date = getTradeDate(trade).split('T')[0]; // Get just the date part
    const pnl = calculateTradePnl(trade);
    const currentDailyPnl = dailyPnl.get(date) || 0;
    dailyPnl.set(date, currentDailyPnl + pnl);
  });

  // Convert to cumulative series with strict ascending order
  let cumulativePnl = 0;
  const series: PnlDataPoint[] = [];

  // Sort dates and ensure at least one point if we have any P&L
  const sortedDates = Array.from(dailyPnl.keys()).sort((a, b) => a.localeCompare(b));
  
  sortedDates.forEach(date => {
    const dailyPnlValue = dailyPnl.get(date) || 0;
    cumulativePnl += dailyPnlValue;
    series.push({
      date,
      value: cumulativePnl,
    });
  });

  // Ensure we return at least one point if there's any realized P&L
  if (series.length === 0 && mode === 'realized') {
    const totalRealizedPnl = sortedTrades.reduce((sum, trade) => {
      const pnl = calculateTradePnl(trade);
      return sum + pnl;
    }, 0);
    
    if (totalRealizedPnl !== 0) {
      const lastTrade = sortedTrades[sortedTrades.length - 1];
      const lastDate = getTradeDate(lastTrade).split('T')[0];
      series.push({
        date: lastDate,
        value: totalRealizedPnl,
      });
    }
  }

  return series;
}

// Calculate comprehensive summary statistics
function calculatePnlSummary(trades: GenericTrade[], filteredData: PnlDataPoint[]): PnlSummary {
  const normalizedTrades = mapTrades(trades);
  
  // Calculate realized P&L from closed trades - prioritize pre-calculated P&L values
  const realizedPnl = normalizedTrades
    .filter(trade => isTradeClosed(trade))
    .reduce((sum, trade) => {
      // Use pre-calculated P&L if available (from position tracker)
      if (trade.pnl !== null && trade.pnl !== undefined) {
        return sum + trade.pnl;
      }
      // Otherwise calculate from entry/exit prices
      const pnl = getTradeRealizedPnl(trade);
      return sum + (pnl || 0);
    }, 0);

  // Calculate unrealized P&L from open trades
  const unrealizedPnl = normalizedTrades
    .filter(trade => !isTradeClosed(trade))
    .reduce((sum, trade) => {
      if (!trade.entry_price || (!trade.mark_price && !trade.last_price)) return sum;
      
      const currentPrice = trade.mark_price || trade.last_price || 0;
      const multiplier = getTradeMultiplier(trade);
      
      let pnl = 0;
      if (trade.side === 'buy') {
        pnl = (currentPrice - trade.entry_price) * trade.quantity * multiplier;
      } else {
        pnl = (trade.entry_price - currentPrice) * trade.quantity * multiplier;
      }
      
      // Subtract fees
      pnl -= (trade.fees || 0);
      
      return sum + pnl;
    }, 0);

  const totalPnl = realizedPnl + unrealizedPnl;

  // Calculate change from filtered data
  const change = filteredData.length > 1 
    ? filteredData[filteredData.length - 1].value - filteredData[filteredData.length - 2].value
    : filteredData.length === 1 
      ? filteredData[0].value 
      : 0;

  // Count trades
  const closedTrades = normalizedTrades.filter(trade => isTradeClosed(trade)).length;
  const openTrades = normalizedTrades.filter(trade => !isTradeClosed(trade)).length;

  return {
    totalPnl,
    realizedPnl,
    unrealizedPnl,
    change,
    totalTrades: trades.length,
    closedTrades,
    openTrades,
  };
}

export function usePnlData(trades: GenericTrade[]): PnlDataResult {
  // Get the current range from URL params
  const urlParams = useUrlParams();
  const currentRange = (urlParams.get('range') as TimeRange) || 'ALL';

  // Build P&L series
  const pnlResult = useMemo(() => buildPnlSeries(trades), [trades]);
  const { series: allData, mode, fallbackUsed } = pnlResult;

  // Filter data based on selected range
  const filteredData = useMemo(() => {
    if (!allData || allData.length === 0) return [];
    
    // Use the most recent data point as reference date
    const referenceDate = allData.length > 0 
      ? new Date(allData[allData.length - 1].date) 
      : new Date();
    
    return filterDataByRange(allData, currentRange, referenceDate);
  }, [allData, currentRange]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    return calculatePnlSummary(trades, filteredData);
  }, [trades, filteredData]);

  return {
    allData,
    filteredData,
    mode,
    fallbackUsed,
    summary,
    totalDataPoints: allData.length,
    filteredDataPoints: filteredData.length,
    currentRange,
  };
}
