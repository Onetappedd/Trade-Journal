"use client"

import { useEffect, useState } from "react"

interface Stock {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: string
}

const initialStocks: Stock[] = [
  { symbol: "AAPL", price: 194.32, change: 2.11, changePercent: 1.09, volume: "45.2M" },
  { symbol: "MSFT", price: 378.85, change: -1.23, changePercent: -0.32, volume: "28.7M" },
  { symbol: "GOOGL", price: 142.56, change: 3.45, changePercent: 2.48, volume: "31.4M" },
  { symbol: "AMZN", price: 155.89, change: -2.67, changePercent: -1.68, volume: "52.1M" },
  { symbol: "TSLA", price: 248.42, change: 12.34, changePercent: 5.23, volume: "89.3M" },
  { symbol: "NVDA", price: 875.28, change: -15.67, changePercent: -1.76, volume: "67.8M" },
  { symbol: "META", price: 326.54, change: 8.92, changePercent: 2.81, volume: "41.2M" },
  { symbol: "NFLX", price: 487.91, change: -3.45, changePercent: -0.7, volume: "15.6M" },
  { symbol: "AMD", price: 142.78, change: 4.56, changePercent: 3.3, volume: "38.9M" },
  { symbol: "CRM", price: 267.43, change: -1.89, changePercent: -0.7, volume: "12.4M" },
  { symbol: "ORCL", price: 118.92, change: 2.34, changePercent: 2.01, volume: "22.1M" },
  { symbol: "ADBE", price: 556.78, change: -7.23, changePercent: -1.28, volume: "18.7M" },
]

export default function TickerTape() {
  const [stocks, setStocks] = useState<Stock[]>(initialStocks)

  // Update stock prices periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks((prevStocks) =>
        prevStocks.map((stock) => {
          const changePercent = (Math.random() - 0.5) * 0.02 // ±1% change
          const change = stock.price * changePercent
          const newPrice = Math.max(0.01, stock.price + change)

          return {
            ...stock,
            price: newPrice,
            change: change,
            changePercent: changePercent * 100,
          }
        }),
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const formatPrice = (price: number) => price.toFixed(2)
  const formatChange = (change: number) => {
    const sign = change >= 0 ? "+" : ""
    return `${sign}${change.toFixed(2)}`
  }
  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? "+" : ""
    const arrow = percent >= 0 ? "▲" : "▼"
    return `${arrow}${sign}${percent.toFixed(2)}%`
  }

  // Create ticker content (duplicate for seamless loop)
  const tickerContent = [...stocks, ...stocks].map((stock, index) => (
    <div key={`${stock.symbol}-${index}`} className="flex items-center space-x-6 px-8">
      <div className="flex items-center space-x-3">
        <span className="font-bold text-white text-sm tracking-wide">{stock.symbol}</span>
        <span className="font-mono text-white text-sm">{formatPrice(stock.price)}</span>
        <span
          className={`font-mono text-xs font-medium ${stock.changePercent >= 0 ? "text-green-400" : "text-red-400"}`}
        >
          {formatPercent(stock.changePercent)}
        </span>
      </div>
    </div>
  ))

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 h-10 bg-black border-t border-gray-800 overflow-hidden">
      {/* Live indicator */}
      <div className="absolute top-2 left-4 flex items-center space-x-2 z-10">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-green-400 text-xs font-semibold tracking-wide">LIVE</span>
      </div>

      {/* Scrolling ticker */}
      <div className="flex items-center h-full">
        <div className="flex animate-scroll-left whitespace-nowrap">{tickerContent}</div>
      </div>

      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black to-transparent pointer-events-none" />
    </div>
  )
}
