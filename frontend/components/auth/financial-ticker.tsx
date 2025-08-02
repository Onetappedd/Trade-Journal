"use client"

import { useEffect, useState } from "react"

const tickerData = [
  { symbol: "AAPL", price: 175.43, change: 2.34, changePercent: 1.35 },
  { symbol: "GOOGL", price: 2847.63, change: -15.23, changePercent: -0.53 },
  { symbol: "MSFT", price: 378.85, change: 4.12, changePercent: 1.1 },
  { symbol: "TSLA", price: 248.5, change: -3.45, changePercent: -1.37 },
  { symbol: "AMZN", price: 3342.88, change: 12.45, changePercent: 0.37 },
  { symbol: "NVDA", price: 875.28, change: 18.92, changePercent: 2.21 },
]

export function FinancialTicker() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % tickerData.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const currentTicker = tickerData[currentIndex]
  const isPositive = currentTicker.change >= 0

  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center space-x-2">
        <span className="font-semibold">{currentTicker.symbol}</span>
        <span className="text-white/80">${currentTicker.price.toFixed(2)}</span>
      </div>
      <div className={`flex items-center space-x-1 ${isPositive ? "text-green-400" : "text-red-400"}`}>
        <span>
          {isPositive ? "+" : ""}
          {currentTicker.change.toFixed(2)}
        </span>
        <span>
          ({isPositive ? "+" : ""}
          {currentTicker.changePercent.toFixed(2)}%)
        </span>
      </div>
    </div>
  )
}
