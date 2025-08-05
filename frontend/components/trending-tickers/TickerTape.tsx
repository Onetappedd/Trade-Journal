"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"

const mockTickers = [
  { symbol: "AAPL", price: 175.43, change: 2.15 },
  { symbol: "MSFT", price: 378.85, change: -1.23 },
  { symbol: "GOOGL", price: 142.56, change: 3.45 },
  { symbol: "AMZN", price: 145.86, change: -0.87 },
  { symbol: "TSLA", price: 248.42, change: 5.67 },
  { symbol: "NVDA", price: 875.28, change: 4.32 },
  { symbol: "META", price: 487.11, change: -2.15 },
  { symbol: "NFLX", price: 445.67, change: 1.89 },
  { symbol: "BTC", price: 43250.75, change: 3.45 },
  { symbol: "ETH", price: 2567.89, change: -1.87 },
]

export function TickerTape() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % mockTickers.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <span className="text-sm font-semibold">LIVE MARKET</span>
          <div className="flex items-center space-x-8">
            {mockTickers.slice(currentIndex, currentIndex + 4).map((ticker, index) => (
              <div key={`${ticker.symbol}-${index}`} className="flex items-center space-x-2 animate-pulse">
                <span className="font-bold">{ticker.symbol}</span>
                <span className="font-mono">${ticker.price.toFixed(2)}</span>
                <div
                  className={`flex items-center space-x-1 ${ticker.change >= 0 ? "text-green-300" : "text-red-300"}`}
                >
                  {ticker.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span className="text-xs font-mono">
                    {ticker.change >= 0 ? "+" : ""}
                    {ticker.change.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs opacity-75">Updated: {new Date().toLocaleTimeString()}</div>
      </div>
    </div>
  )
}
