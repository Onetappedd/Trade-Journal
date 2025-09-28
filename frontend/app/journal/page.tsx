"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState } from "@/components/empty-state"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/providers/auth-provider"
import { TradeRow } from "@/types/trade"
import {
  Plus,
  Calendar,
  Tag,
  FileText,
  Clock,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ImageIcon,
  X,
  RefreshCw,
} from "lucide-react"

interface JournalEntry {
  id: string
  date: string
  time: string
  symbol: string
  direction: "long" | "short"
  pnl: number
  note: string
  tags: string[]
  screenshot?: string
}

export default function JournalPage() {
  const { session } = useAuth()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [trades, setTrades] = useState<TradeRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newEntry, setNewEntry] = useState({
    symbol: "",
    direction: "long" as "long" | "short",
    pnl: "",
    note: "",
    tags: "",
    screenshot: null as File | null,
  })

  // Convert TradeRow to JournalEntry
  const convertTradeToJournalEntry = (trade: TradeRow): JournalEntry => {
    const openedAt = new Date(trade.opened_at)
    
    return {
      id: trade.id,
      date: openedAt.toISOString().split("T")[0],
      time: openedAt.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }),
      symbol: trade.symbol,
      direction: trade.qty_opened > 0 ? "long" : "short",
      pnl: trade.realized_pnl || 0,
      note: `Trade: ${trade.symbol} ${trade.instrument_type} - ${trade.qty_opened > 0 ? 'Long' : 'Short'} ${Math.abs(trade.qty_opened)} shares at $${trade.avg_open_price}`,
      tags: [trade.instrument_type, trade.qty_opened > 0 ? "long" : "short"],
    }
  }

  // Fetch trades from backend
  const fetchTrades = useCallback(async () => {
    if (!session) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/trades', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTrades(data.trades || [])
        
        // Convert trades to journal entries
        const journalEntries = data.trades?.map(convertTradeToJournalEntry) || []
        setEntries(journalEntries)
      } else {
        throw new Error('Failed to fetch trades')
      }
    } catch (error) {
      console.error('Error fetching trades:', error)
      toast({
        title: "Error",
        description: "Failed to load trade journal entries",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (session) {
      fetchTrades()
    }
  }, [session, fetchTrades])

  // Group entries by date
  const groupedEntries = entries.reduce(
    (groups, entry) => {
      const date = entry.date
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(entry)
      return groups
    },
    {} as Record<string, JournalEntry[]>,
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }
  }

  const handleAddEntry = () => {
    // Validation
    if (!newEntry.symbol || !newEntry.pnl || !newEntry.note) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Success",
      description: "Journal entry added successfully",
    })
    setIsAddModalOpen(false)
    setNewEntry({
      symbol: "",
      direction: "long",
      pnl: "",
      note: "",
      tags: "",
      screenshot: null,
    })
  }

  const handleScreenshotUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast({
          title: "Error",
          description: "Screenshot must be less than 5MB",
          variant: "destructive",
        })
        return
      }
      setNewEntry((prev) => ({ ...prev, screenshot: file }))
      toast({
        title: "Success",
        description: "Screenshot uploaded successfully",
      })
    }
  }

  if (entries.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EmptyState
            icon={FileText}
            title="No journal entries yet"
            description="Start documenting your trades to track your progress and improve your strategy"
            onAction={() => setIsAddModalOpen(true)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800/50 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Riskr</h1>
              <p className="text-slate-400 text-sm sm:text-base">Document and analyze your trading decisions</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchTrades}
                disabled={isLoading}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Entry
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Add Journal Entry</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="symbol" className="text-slate-300">Symbol *</Label>
                        <Input
                          id="symbol"
                          value={newEntry.symbol}
                          onChange={(e) => setNewEntry((prev) => ({ ...prev, symbol: e.target.value }))}
                          placeholder="AAPL"
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="direction" className="text-slate-300">Direction</Label>
                        <select
                          id="direction"
                          value={newEntry.direction}
                          onChange={(e) => setNewEntry((prev) => ({ ...prev, direction: e.target.value as "long" | "short" }))}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white"
                        >
                          <option value="long">Long</option>
                          <option value="short">Short</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="pnl" className="text-slate-300">P&L *</Label>
                      <Input
                        id="pnl"
                        type="number"
                        step="0.01"
                        value={newEntry.pnl}
                        onChange={(e) => setNewEntry((prev) => ({ ...prev, pnl: e.target.value }))}
                        placeholder="1247.50"
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="note" className="text-slate-300">Notes *</Label>
                      <Textarea
                        id="note"
                        value={newEntry.note}
                        onChange={(e) => setNewEntry((prev) => ({ ...prev, note: e.target.value }))}
                        placeholder="Describe your trade setup, reasoning, and lessons learned..."
                        rows={4}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tags" className="text-slate-300">Tags</Label>
                      <Input
                        id="tags"
                        value={newEntry.tags}
                        onChange={(e) => setNewEntry((prev) => ({ ...prev, tags: e.target.value }))}
                        placeholder="breakout, momentum, tech"
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="screenshot" className="text-slate-300">Screenshot</Label>
                      <Input
                        id="screenshot"
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotUpload}
                        className="bg-slate-800 border-slate-700 text-white file:bg-slate-700 file:text-white file:border-0 file:rounded-md file:px-3 file:py-1"
                      />
                      {newEntry.screenshot && (
                        <div className="flex items-center space-x-2 text-emerald-400">
                          <ImageIcon className="h-4 w-4" />
                          <span className="text-sm">{newEntry.screenshot.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setNewEntry((prev) => ({ ...prev, screenshot: null }))}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">Max file size: 5MB. Supported formats: JPG, PNG, GIF</p>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddModalOpen(false)}
                      className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddEntry} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      Add Entry
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {Object.entries(groupedEntries)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([date, dateEntries]) => (
              <div key={date} className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-xl font-semibold text-white">{formatDate(date)}</h2>
                  <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                    {dateEntries.length} {dateEntries.length === 1 ? "entry" : "entries"}
                  </Badge>
                </div>
                <div className="grid gap-4">
                  {dateEntries.map((entry) => (
                    <Card key={entry.id} className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className="text-lg font-semibold text-white">{entry.symbol}</h3>
                              <Badge
                                variant={entry.direction === "long" ? "default" : "destructive"}
                                className={
                                  entry.direction === "long"
                                    ? "bg-emerald-600 text-white"
                                    : "bg-red-600 text-white"
                                }
                              >
                                {entry.direction.toUpperCase()}
                              </Badge>
                              <div className="flex items-center space-x-1 text-slate-400">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm">{entry.time}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 mb-4">
                              <div className="flex items-center space-x-1">
                                <DollarSign className="h-4 w-4 text-slate-400" />
                                <span
                                  className={`font-semibold ${
                                    entry.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                                  }`}
                                >
                                  {entry.pnl >= 0 ? "+" : ""}${entry.pnl.toFixed(2)}
                                </span>
                              </div>
                              {entry.pnl >= 0 ? (
                                <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4 text-red-400" />
                              )}
                            </div>
                            <p className="text-slate-300 mb-4 leading-relaxed">{entry.note}</p>
                            {entry.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {entry.tags.map((tag, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="border-slate-600 text-slate-300 bg-slate-800/50"
                                  >
                                    <Tag className="h-3 w-3 mr-1" />
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          {entry.screenshot && (
                            <div className="ml-4">
                              <div className="w-20 h-20 bg-slate-800 rounded-lg flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-slate-400" />
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent"
          >
            Load More Entries
          </Button>
        </div>
      </div>
    </div>
  )
}
