"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState } from "@/components/empty-state"
import { showNotification } from "@/lib/notifications"
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

// Mock data for demonstration
const mockEntries: JournalEntry[] = [
  {
    id: "1",
    date: "2024-01-15",
    time: "14:30",
    symbol: "AAPL",
    direction: "long",
    pnl: 1247.5,
    note: "Strong breakout above resistance at $175. Volume confirmation with institutional buying. Held through minor pullback and exited at target.",
    tags: ["breakout", "momentum", "tech"],
    screenshot: "/trading-chart-screenshot.jpg",
  },
  {
    id: "2",
    date: "2024-01-15",
    time: "11:45",
    symbol: "TSLA",
    direction: "short",
    pnl: -523.75,
    note: "Anticipated rejection at $250 resistance but underestimated buying pressure from earnings optimism. Cut losses quickly.",
    tags: ["resistance", "earnings", "loss"],
  },
  {
    id: "3",
    date: "2024-01-14",
    time: "16:15",
    symbol: "MSFT",
    direction: "long",
    pnl: 892.25,
    note: "Cloud earnings beat expectations. Entered on pullback to support, rode the momentum wave. Perfect risk/reward setup.",
    tags: ["earnings", "cloud", "support"],
  },
  {
    id: "4",
    date: "2024-01-14",
    time: "10:20",
    symbol: "NVDA",
    direction: "long",
    pnl: 2134.8,
    note: "AI sector rotation play. Entered early on sector strength signals. Multiple timeframe confirmation. Scaled out at resistance levels.",
    tags: ["AI", "sector-rotation", "scaling"],
    screenshot: "/nvda-chart-analysis.jpg",
  },
  {
    id: "5",
    date: "2024-01-13",
    time: "13:10",
    symbol: "SPY",
    direction: "short",
    pnl: 456.3,
    note: "Market showing weakness at key level. VIX spike confirmed fear. Quick scalp on the breakdown with tight stops.",
    tags: ["SPY", "VIX", "scalp"],
  },
]

export default function JournalPage() {
  const [entries] = useState<JournalEntry[]>(mockEntries)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newEntry, setNewEntry] = useState({
    symbol: "",
    direction: "long" as "long" | "short",
    pnl: "",
    note: "",
    tags: "",
    screenshot: null as File | null,
  })

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
      showNotification.error("Please fill in all required fields")
      return
    }

    showNotification.success("Journal entry added successfully")
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
        showNotification.error("Screenshot must be less than 5MB")
        return
      }
      setNewEntry((prev) => ({ ...prev, screenshot: file }))
      showNotification.success("Screenshot uploaded successfully")
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
            action={{
              label: "Add First Entry",
              onClick: () => setIsAddModalOpen(true),
            }}
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
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Trading Journal</h1>
              <p className="text-slate-400 text-sm sm:text-base">Document and analyze your trading decisions</p>
            </div>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl text-white">Add Journal Entry</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="symbol" className="text-slate-300">
                        Symbol *
                      </Label>
                      <Input
                        id="symbol"
                        placeholder="e.g., AAPL"
                        value={newEntry.symbol}
                        onChange={(e) => setNewEntry((prev) => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                        className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="direction" className="text-slate-300">
                        Direction
                      </Label>
                      <select
                        id="direction"
                        value={newEntry.direction}
                        onChange={(e) =>
                          setNewEntry((prev) => ({ ...prev, direction: e.target.value as "long" | "short" }))
                        }
                        className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-md text-white"
                      >
                        <option value="long">Long</option>
                        <option value="short">Short</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pnl" className="text-slate-300">
                      P&L ($) *
                    </Label>
                    <Input
                      id="pnl"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 1247.50 or -523.75"
                      value={newEntry.pnl}
                      onChange={(e) => setNewEntry((prev) => ({ ...prev, pnl: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="note" className="text-slate-300">
                      Trade Notes *
                    </Label>
                    <Textarea
                      id="note"
                      placeholder="Describe your trade setup, reasoning, and lessons learned..."
                      value={newEntry.note}
                      onChange={(e) => setNewEntry((prev) => ({ ...prev, note: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white placeholder-slate-500 min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-slate-300">
                      Tags
                    </Label>
                    <Input
                      id="tags"
                      placeholder="e.g., breakout, momentum, earnings (comma separated)"
                      value={newEntry.tags}
                      onChange={(e) => setNewEntry((prev) => ({ ...prev, tags: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="screenshot" className="text-slate-300">
                      Screenshot (Optional)
                    </Label>
                    <div className="flex items-center space-x-4">
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
                      className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddEntry} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      Add Entry
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {Object.entries(groupedEntries)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([date, dateEntries]) => (
              <div key={date} className="relative">
                {/* Date Header - Sticky */}
                <div className="sticky top-16 z-30 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80 border-b border-slate-800/50 py-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-emerald-400" />
                    <h2 className="text-xl font-semibold text-white">{formatDate(date)}</h2>
                    <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                      {dateEntries.length} {dateEntries.length === 1 ? "trade" : "trades"}
                    </Badge>
                  </div>
                </div>

                {/* Timeline Line */}
                <div className="absolute left-8 top-20 bottom-0 w-0.5 bg-slate-800"></div>

                {/* Entries */}
                <div className="space-y-6 pb-12">
                  {dateEntries
                    .sort((a, b) => b.time.localeCompare(a.time))
                    .map((entry, index) => (
                      <div key={entry.id} className="relative flex items-start space-x-6">
                        {/* Timeline Dot */}
                        <div className="relative z-10 flex-shrink-0">
                          <div
                            className={`h-4 w-4 rounded-full border-2 ${
                              entry.pnl >= 0 ? "bg-emerald-400 border-emerald-400" : "bg-red-400 border-red-400"
                            }`}
                          ></div>
                        </div>

                        {/* Entry Card */}
                        <Card className="flex-1 bg-slate-900/50 border-slate-800/50 hover:border-slate-700/50 transition-colors">
                          <CardContent className="p-6">
                            {/* Entry Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-3 sm:space-y-0">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-3">
                                  <div className="h-10 w-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
                                    <span className="text-sm font-semibold text-white">{entry.symbol}</span>
                                  </div>
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <Badge
                                        variant={entry.direction === "long" ? "default" : "secondary"}
                                        className={`${
                                          entry.direction === "long"
                                            ? "bg-emerald-600 text-white"
                                            : "bg-red-600 text-white"
                                        } flex items-center space-x-1`}
                                      >
                                        {entry.direction === "long" ? (
                                          <ArrowUpRight className="h-3 w-3" />
                                        ) : (
                                          <ArrowDownRight className="h-3 w-3" />
                                        )}
                                        <span>{entry.direction.toUpperCase()}</span>
                                      </Badge>
                                      <div className="flex items-center space-x-1 text-slate-400">
                                        <Clock className="h-3 w-3" />
                                        <span className="text-sm">{entry.time}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-4">
                                <div className="text-right">
                                  <div
                                    className={`text-lg font-semibold flex items-center ${
                                      entry.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                                    }`}
                                  >
                                    <DollarSign className="h-4 w-4 mr-1" />
                                    {entry.pnl >= 0 ? "+" : ""}
                                    {entry.pnl.toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Entry Content */}
                            <div className="space-y-4">
                              <p className="text-slate-300 leading-relaxed">{entry.note}</p>

                              {/* Screenshot */}
                              {entry.screenshot && (
                                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                                  <img
                                    src={entry.screenshot || "/placeholder.svg"}
                                    alt="Trade screenshot"
                                    className="w-full max-w-md rounded-lg border border-slate-700/50"
                                  />
                                </div>
                              )}

                              {/* Tags */}
                              {entry.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {entry.tags.map((tag, tagIndex) => (
                                    <Badge
                                      key={tagIndex}
                                      variant="secondary"
                                      className="bg-slate-800/50 text-slate-300 border-slate-700/50 flex items-center space-x-1"
                                    >
                                      <Tag className="h-3 w-3" />
                                      <span>{tag}</span>
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                </div>
              </div>
            ))}

          {/* Load More Button */}
          <div className="text-center py-8">
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent"
            >
              Load More Entries
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
