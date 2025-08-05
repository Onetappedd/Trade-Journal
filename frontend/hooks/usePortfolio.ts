"use client"

import useSWR from 'swr'

export interface Position {
  symbol: string
  quantity: number
  avgCost: number
  totalCost: number
  currentPrice: number
  marketValue: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
}

export interface PortfolioAnalytics {
  totalTrades: number
  totalPnL: number
  realizedPnL: number
  unrealizedPnL: number
  winRate: number
  avgWin: number
  avgLoss: number
  profitFactor: number
  sharpeRatio: number
  maxDrawdown: number
  monthlyReturns: Array<{
    month: string
    pnl: number
    trades: number
  }>
  performanceBySymbol: Array<{
    symbol: string
    trades: number
    pnl: number
    winRate: number
  }>
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch data')
  }
  return response.json()
}

// Hook for portfolio positions
export function usePortfolioPositions(refreshInterval: number = 30000) {
  const { data, error, isLoading, mutate } = useSWR<Position[]>(
    '/api/portfolio/positions',
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: true,
      dedupingInterval: 15000,
    }
  )

  const totalMarketValue = data?.reduce((sum, pos) => sum + pos.marketValue, 0) || 0
  const totalUnrealizedPnL = data?.reduce((sum, pos) => sum + pos.unrealizedPnL, 0) || 0
  const totalCost = data?.reduce((sum, pos) => sum + pos.totalCost, 0) || 0
  const totalUnrealizedPnLPercent = totalCost !== 0 ? (totalUnrealizedPnL / Math.abs(totalCost)) * 100 : 0

  return {
    positions: data || [],
    isLoading,
    error,
    refresh: mutate,
    summary: {
      totalMarketValue,
      totalUnrealizedPnL,
      totalUnrealizedPnLPercent,
      totalCost,
      positionCount: data?.length || 0,
    },
  }
}

// Hook for portfolio analytics
export function usePortfolioAnalytics(refreshInterval: number = 60000) {
  const { data, error, isLoading, mutate } = useSWR<PortfolioAnalytics>(
    '/api/portfolio/analytics',
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: true,
      dedupingInterval: 30000,
    }
  )

  return {
    analytics: data,
    isLoading,
    error,
    refresh: mutate,
  }
}

// Hook for dashboard summary combining positions and analytics
export function useDashboardSummary() {
  const { positions, summary: positionSummary, isLoading: positionsLoading } = usePortfolioPositions()
  const { analytics, isLoading: analyticsLoading } = usePortfolioAnalytics()

  const isLoading = positionsLoading || analyticsLoading

  const dashboardStats = {
    // Portfolio value
    portfolioValue: positionSummary.totalMarketValue,
    dayChange: positionSummary.totalUnrealizedPnL,
    dayChangePercent: positionSummary.totalUnrealizedPnLPercent,
    
    // Trading performance
    totalPnL: analytics?.totalPnL || 0,
    realizedPnL: analytics?.realizedPnL || 0,
    unrealizedPnL: analytics?.unrealizedPnL || 0,
    
    // Trade statistics
    totalTrades: analytics?.totalTrades || 0,
    winRate: analytics?.winRate || 0,
    profitFactor: analytics?.profitFactor || 0,
    
    // Position info
    activePositions: positions.length,
    topGainer: positions.length > 0 
      ? positions.reduce((max, pos) => pos.unrealizedPnLPercent > max.unrealizedPnLPercent ? pos : max)
      : null,
    topLoser: positions.length > 0
      ? positions.reduce((min, pos) => pos.unrealizedPnLPercent < min.unrealizedPnLPercent ? pos : min)
      : null,
  }

  return {
    dashboardStats,
    positions,
    analytics,
    isLoading,
  }
}