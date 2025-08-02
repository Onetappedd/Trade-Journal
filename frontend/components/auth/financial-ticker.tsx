"use client"

import { useEffect, useState } from "react"

const tickerData = [
  { symbol: "AAPL", price: 175.43, change: 2.34 },
  { symbol: "GOOGL", price: 2847.52, change: -15.23 },
  { symbol: "MSFT", price: 378.85, change: 5.67 },
  { symbol: "TSLA", price: 248.42, change: -8.91 },
  { symbol: "AMZN", price: 3127.45, change: 12.34 },
  { symbol: "NVDA", price: 875.28, change: 23.45 },
]

export function FinancialTicker() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % tickerData.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const currentTicker = tickerData[currentIndex]
  const isPositive = currentTicker.change > 0

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 border border-white/10">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-bold text-white">{currentTicker.symbol}</div>
          <div className="text-2xl font-mono text-white">${currentTicker.price.toFixed(2)}</div>
        </div>
        <div className={`text-right ${isPositive ? "text-green-400" : "text-red-400"}`}>
          <div className="text-sm">
            {isPositive ? "+" : ""}
            {currentTicker.change.toFixed(2)}
          </div>
          <div className="text-xs">
            {isPositive ? "+" : ""}
            {((currentTicker.change / currentTicker.price) * 100).toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  )
}
