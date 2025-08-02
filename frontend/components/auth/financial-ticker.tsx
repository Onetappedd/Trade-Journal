"use client"

import { useEffect, useState } from "react"

const mockStocks = [
  { symbol: "AAPL", price: 175.43, change: 2.34 },
  { symbol: "GOOGL", price: 2847.52, change: -15.23 },
  { symbol: "MSFT", price: 378.85, change: 5.67 },
  { symbol: "TSLA", price: 248.42, change: -8.91 },
  { symbol: "AMZN", price: 3247.15, change: 12.45 },
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
    <div className="bg-black/20 backdrop-blur-sm rounded-lg p-3 text-white border border-white/10">
      <div className="flex items-center space-x-2">
        <span className="font-bold text-lg">{currentStock.symbol}</span>
        <span className="text-lg">${currentStock.price.toFixed(2)}</span>
        <span className={`text-sm ${isPositive ? "text-green-400" : "text-red-400"}`}>
          {isPositive ? "+" : ""}
          {currentStock.change.toFixed(2)}
        </span>
      </div>
    </div>
  )
}
