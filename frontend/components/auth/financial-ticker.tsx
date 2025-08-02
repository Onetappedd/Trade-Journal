"use client"

import { useEffect, useState } from "react"

const mockStocks = [
  { symbol: "AAPL", price: 175.43, change: 2.34 },
  { symbol: "GOOGL", price: 2847.52, change: -15.67 },
  { symbol: "MSFT", price: 378.85, change: 4.21 },
  { symbol: "TSLA", price: 248.42, change: -8.93 },
  { symbol: "AMZN", price: 3247.15, change: 12.45 },
  { symbol: "NVDA", price: 875.28, change: 23.67 },
]

export function FinancialTicker() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % mockStocks.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const currentStock = mockStocks[currentIndex]
  const isPositive = currentStock.change > 0

  return (
    <div className="absolute top-4 left-4 z-20">
      <div className="bg-black/20 backdrop-blur-sm rounded-lg p-3 border border-white/10">
        <div className="flex items-center space-x-3">
          <div className="text-white font-mono text-sm">{currentStock.symbol}</div>
          <div className="text-white font-mono text-sm">${currentStock.price.toFixed(2)}</div>
          <div className={`font-mono text-sm ${isPositive ? "text-green-400" : "text-red-400"}`}>
            {isPositive ? "+" : ""}
            {currentStock.change.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  )
}
