"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/empty-state"
import { Trophy, Medal, Crown, Users, Star, Award, Download, RefreshCw, Sparkles } from "lucide-react"

// Mock data for leaderboard
const mockLeaderboardData = Array.from({ length: 1000 }, (_, i) => {
  const baseData = [
    {
      username: "TradeKing_2024",
      avatar: "TK",
      totalPnL: 247832.5,
      percentGain: 34.7,
      winRate: 78.2,
      totalTrades: 156,
      isVerified: true,
    },
    {
      username: "AlphaTrader",
      avatar: "AT",
      totalPnL: 198456.75,
      percentGain: 28.9,
      winRate: 72.1,
      totalTrades: 203,
      isVerified: true,
    },
    {
      username: "RiskMaster",
      avatar: "RM",
      totalPnL: 176234.25,
      percentGain: 25.3,
      winRate: 69.8,
      totalTrades: 189,
      isVerified: false,
    },
    {
      username: "QuantWizard",
      avatar: "QW",
      totalPnL: 145678.9,
      percentGain: 22.1,
      winRate: 65.4,
      totalTrades: 234,
      isVerified: true,
    },
    {
      username: "BullMarket_Pro",
      avatar: "BP",
      totalPnL: 134567.8,
      percentGain: 19.8,
      winRate: 63.2,
      totalTrades: 178,
      isVerified: false,
    },
    {
      username: "SwingTrader_X",
      avatar: "SX",
      totalPnL: 123456.7,
      percentGain: 18.5,
      winRate: 61.7,
      totalTrades: 145,
      isVerified: true,
    },
    {
      username: "DayTrader_Elite",
      avatar: "DE",
      totalPnL: 112345.6,
      percentGain: 16.9,
      winRate: 59.3,
      totalTrades: 267,
      isVerified: false,
    },
    {
      username: "OptionsGuru",
      avatar: "OG",
      totalPnL: 98765.4,
      percentGain: 15.2,
      winRate: 57.8,
      totalTrades: 198,
      isVerified: true,
    },
  ]

  const baseIndex = i % baseData.length
  const base = baseData[baseIndex]
  const variation = (Math.random() - 0.5) * 0.3

  return {
    rank: i + 1,
    username: `${base.username}_${i + 1}`,
    avatar: base.avatar,
    totalPnL: base.totalPnL * (1 + variation),
    percentGain: base.percentGain * (1 + variation),
    winRate: Math.max(30, Math.min(95, base.winRate * (1 + variation * 0.5))),
    totalTrades: Math.floor(base.totalTrades * (1 + Math.abs(variation))),
    isVerified: Math.random() > 0.6,
  }
})

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState("monthly")
  const [sortBy, setSortBy] = useState("pnl")
  const [hasData] = useState(true)
  const [isLoading] = useState(false)

  const sortedData = useMemo(() => {
    const sorted = [...mockLeaderboardData]
    switch (sortBy) {
      case "percentage":
        return sorted.sort((a, b) => b.percentGain - a.percentGain)
      case "winrate":
        return sorted.sort((a, b) => b.winRate - a.winRate)
      default:
        return sorted.sort((a, b) => b.totalPnL - a.totalPnL)
    }
  }, [sortBy])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-400" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return null
    }
  }

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black"
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-black"
      case 3:
        return "bg-gradient-to-r from-amber-400 to-amber-600 text-black"
      default:
        return "bg-slate-700 text-slate-300"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (!hasData) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EmptyState
            icon={Trophy}
            title="No leaderboard entries yet"
            description="Import your trades to compete with other traders and see your ranking"
            onAction={() => window.location.href = "/import"}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800/50 bg-slate-950/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">Trader Leaderboard</h1>
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 text-sm font-medium">
                <Sparkles className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            </div>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              See how top traders are performing and compete for the highest returns
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-3 sm:w-auto bg-slate-800/50 border border-slate-700/50">
              <TabsTrigger value="weekly" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                Weekly
              </TabsTrigger>
              <TabsTrigger
                value="monthly"
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              >
                Monthly
              </TabsTrigger>
              <TabsTrigger value="annual" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                Annual
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center space-x-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700/50 text-slate-300">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="pnl">Total P&L</SelectItem>
                <SelectItem value="percentage">% Gain</SelectItem>
                <SelectItem value="winrate">Win Rate</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} className="space-y-8">
          <TabsContent value="weekly" className="space-y-8">
            {/* Top 3 Traders */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sortedData.slice(0, 3).map((trader, index) => (
                <Card
                  key={trader.rank}
                  className={`bg-slate-900/50 border-slate-800/50 ${index === 0 ? "ring-2 ring-emerald-500/50" : ""}`}
                >
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center mb-4">
                      {getRankIcon(index + 1)}
                      <Badge className={`ml-2 ${getRankBadgeColor(index + 1)} font-bold text-lg px-4 py-2`}>
                        #{index + 1}
                      </Badge>
                    </div>

                    <div className="mb-4">
                      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-3">
                        <span className="text-white font-bold text-xl">{trader.avatar}</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <h3 className="font-semibold text-white text-lg">{trader.username}</h3>
                        {trader.isVerified && <Star className="h-4 w-4 text-emerald-400 fill-current" />}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="text-3xl font-bold text-emerald-400">{formatCurrency(trader.totalPnL)}</div>
                        <div className="text-sm text-slate-400">Total P&L</div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-semibold text-white text-lg">+{trader.percentGain.toFixed(1)}%</div>
                          <div className="text-slate-400">Gain</div>
                        </div>
                        <div>
                          <div className="font-semibold text-white text-lg">{trader.winRate.toFixed(1)}%</div>
                          <div className="text-slate-400">Win Rate</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Full Leaderboard */}
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-white flex items-center">
                    <Users className="h-5 w-5 mr-2 text-emerald-400" />
                    Full Rankings ({sortedData.length.toLocaleString()} traders)
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Desktop Table */}
                <div className="hidden lg:block">
                  <div className="border border-slate-800/30 rounded-lg overflow-hidden">
                    <div className="border-b border-slate-800/50 bg-slate-900/50 sticky top-0 z-10">
                      <div className="flex items-center py-3 px-4 text-slate-400 font-medium text-sm">
                        <div className="w-20">Rank</div>
                        <div className="flex-1">Trader</div>
                        <div className="text-right w-24">Total P&L</div>
                        <div className="text-right w-20">% Gain</div>
                        <div className="text-right w-16">Win Rate</div>
                        <div className="text-right w-16">Trades</div>
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {sortedData.slice(0, 100).map((trader) => (
                        <div
                          key={trader.rank}
                          className="border-b border-slate-800/30 hover:bg-slate-800/30 transition-colors px-4"
                        >
                          <div className="flex items-center py-4">
                            <div className="flex items-center space-x-2 w-20">
                              {getRankIcon(trader.rank)}
                              <Badge className={`${getRankBadgeColor(trader.rank)} text-xs`}>#{trader.rank}</Badge>
                            </div>

                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-semibold text-xs">{trader.avatar}</span>
                              </div>
                              <div className="flex items-center space-x-2 min-w-0">
                                <span className="font-medium text-white truncate">{trader.username}</span>
                                {trader.isVerified && (
                                  <Star className="h-3 w-3 text-emerald-400 fill-current flex-shrink-0" />
                                )}
                              </div>
                            </div>

                            <div className="text-right w-24">
                              <span className="font-semibold text-emerald-400 text-sm">
                                {formatCurrency(trader.totalPnL)}
                              </span>
                            </div>

                            <div className="text-right w-20">
                              <span className="font-semibold text-emerald-400 text-sm">
                                +{trader.percentGain.toFixed(1)}%
                              </span>
                            </div>

                            <div className="text-right w-16">
                              <span className="font-medium text-white text-sm">{trader.winRate.toFixed(1)}%</span>
                            </div>

                            <div className="text-right w-16">
                              <span className="text-slate-400 text-sm">{trader.totalTrades}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-4">
                  {sortedData.slice(0, 50).map((trader) => (
                    <Card key={trader.rank} className="bg-slate-800/30 border-slate-700/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              {getRankIcon(trader.rank)}
                              <Badge className={`${getRankBadgeColor(trader.rank)} text-2xl font-bold px-4 py-2`}>
                                #{trader.rank}
                              </Badge>
                            </div>
                          </div>
                          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                            <span className="text-white font-semibold text-lg">{trader.avatar}</span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-white text-xl">{trader.username}</h3>
                            {trader.isVerified && <Star className="h-5 w-5 text-emerald-400 fill-current" />}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-2xl font-bold text-emerald-400">{formatCurrency(trader.totalPnL)}</div>
                            <div className="text-sm text-slate-400">Total P&L</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-emerald-400">+{trader.percentGain.toFixed(1)}%</div>
                            <div className="text-sm text-slate-400">% Gain</div>
                          </div>
                          <div>
                            <div className="text-xl font-semibold text-white">{trader.winRate.toFixed(1)}%</div>
                            <div className="text-sm text-slate-400">Win Rate</div>
                          </div>
                          <div>
                            <div className="text-xl font-semibold text-white">{trader.totalTrades}</div>
                            <div className="text-sm text-slate-400">Total Trades</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {sortedData.length > 50 && (
                    <div className="text-center pt-4">
                      <Button
                        variant="outline"
                        className="border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent"
                      >
                        Load More ({(sortedData.length - 50).toLocaleString()} remaining)
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-8">
            {/* Top 3 Traders */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sortedData.slice(0, 3).map((trader, index) => (
                <Card
                  key={trader.rank}
                  className={`bg-slate-900/50 border-slate-800/50 ${index === 0 ? "ring-2 ring-emerald-500/50" : ""}`}
                >
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center mb-4">
                      {getRankIcon(index + 1)}
                      <Badge className={`ml-2 ${getRankBadgeColor(index + 1)} font-bold text-lg px-4 py-2`}>
                        #{index + 1}
                      </Badge>
                    </div>

                    <div className="mb-4">
                      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-3">
                        <span className="text-white font-bold text-xl">{trader.avatar}</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <h3 className="font-semibold text-white text-lg">{trader.username}</h3>
                        {trader.isVerified && <Star className="h-4 w-4 text-emerald-400 fill-current" />}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="text-3xl font-bold text-emerald-400">
                          {formatCurrency(trader.totalPnL * 1.2)}
                        </div>
                        <div className="text-sm text-slate-400">Total P&L</div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-semibold text-white text-lg">
                            +{(trader.percentGain * 1.1).toFixed(1)}%
                          </div>
                          <div className="text-slate-400">Gain</div>
                        </div>
                        <div>
                          <div className="font-semibold text-white text-lg">{trader.winRate.toFixed(1)}%</div>
                          <div className="text-slate-400">Win Rate</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Monthly Rankings</h3>
                <p className="text-slate-400">Monthly leaderboard data will be displayed here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="annual" className="space-y-8">
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Annual Rankings</h3>
                <p className="text-slate-400">Annual leaderboard data will be displayed here</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
