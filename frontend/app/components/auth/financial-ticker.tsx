"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"

const mockTickers = [
  { symbol: "NVDA", price: 942.89, change: 15.53, changePercent: 1.68 },
  { symbol: "TSLA", price: 175.79, change: -1.93, changePercent: -1.09 },
  { symbol: "AAPL", price: 189.98, change: 2.44, changePercent: 1.3 },
  { symbol: "BTC-USD", price: 68345.21, change: -1234.56, changePercent: -1.77 },
  { symbol: "ETH-USD", price: 3456.78, change: 78.91, changePercent: 2.34 },
  { symbol: "SPY", price: 520.43, change: 1.23, changePercent: 0.24 },
  { symbol: "GOOGL", price: 153.21, change: -0.56, changePercent: -0.36 },
  { symbol: "AMZN", price: 180.38, change: 1.02, changePercent: 0.57 },
]

export function FinancialTicker() {
  const [tickerData, setTickerData] = useState(mockTickers)

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerData((prevData) =>
        prevData.map((ticker) => {
          const change = (Math.random() - 0.5) * (ticker.price * 0.01)
          const newPrice = ticker.price + change
          const newChangePercent = (change / ticker.price) * 100
          return {
            ...ticker,
            price: Number.parseFloat(newPrice.toFixed(2)),
            change: Number.parseFloat(change.toFixed(2)),
            changePercent: Number.parseFloat(newChangePercent.toFixed(2)),
          }
        }),
      )
    }, 2000) // Update data every 2 seconds

    return () => clearInterval(interval)
  }, [])

  const TickerItem = ({ item }: { item: (typeof tickerData)[0] }) => {
    const isUp = item.change >= 0
    return (
      <div className="flex items-center space-x-4 px-6 text-sm">
        <span className="font-bold text-gray-300">{item.symbol}</span>
        <span className="text-white">{item.price.toLocaleString()}</span>
        <div className={`flex items-center ${isUp ? "text-green-400" : "text-red-400"}`}>
          {isUp ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
          <span>{item.change.toFixed(2)}</span>
          <span className="ml-2">({item.changePercent.toFixed(2)}%)</span>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 h-12 bg-black/30 backdrop-blur-sm overflow-hidden z-20 border-t border-white/10">
      <div className="w-full h-full flex items-center">
        <div className="animate-ticker-scroll flex-shrink-0 flex items-center">
          {tickerData.map((item, index) => (
            <TickerItem key={`${item.symbol}-${index}`} item={item} />
          ))}
          {tickerData.map((item, index) => (
            <TickerItem key={`duplicate-${item.symbol}-${index}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}
