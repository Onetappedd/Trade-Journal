"use client"

import { useState, useEffect } from "react"

const stocks = [
  { symbol: "AAPL", price: 175.43, change: 2.34 },
  { symbol: "GOOGL", price: 2847.52, change: -15.67 },
  { symbol: "MSFT", price: 378.85, change: 5.21 },
  { symbol: "TSLA", price: 248.42, change: -8.93 },
  { symbol: "AMZN", price: 3127.45, change: 12.78 },
]

export function FinancialTicker() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % stocks.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const currentStock = stocks[currentIndex]
  const isPositive = currentStock.change > 0

  return (
    <div className="mt-4 p-3 bg-black/30 rounded-lg backdrop-blur-sm">
      <div className="flex items-center justify-between text-sm">
        <span className="text-white font-mono">{currentStock.symbol}</span>
        <div className="flex items-center space-x-2">
          <span className="text-white font-mono">${currentStock.price.toFixed(2)}</span>
          <span className={`font-mono ${isPositive ? "text-green-400" : "text-red-400"}`}>
            {isPositive ? "+" : ""}
            {currentStock.change.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  )
}
