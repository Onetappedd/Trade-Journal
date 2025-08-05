"use client"
import { useEffect, useRef, useState } from "react"

interface Candle {
  id: number
  x: number
  open: number
  high: number
  low: number
  close: number
  isGreen: boolean
}

export default function BackgroundChartAnimation() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [candles, setCandles] = useState<Candle[]>([])
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const candleIdRef = useRef(0)
  const lastPriceRef = useRef(100)
  const animationRef = useRef<number>()

  // Initialize dimensions
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  // Generate realistic candle data
  const generateCandle = (x: number): Candle => {
    const lastPrice = lastPriceRef.current
    const volatility = 0.008 // 0.8% volatility
    const trend = (Math.random() - 0.5) * 0.002 // Small trend bias

    // Generate open price with momentum
    const open = lastPrice + (Math.random() - 0.5) * lastPrice * volatility * 0.5

    // Generate close with trend
    const close = open + (Math.random() - 0.5 + trend) * lastPrice * volatility

    // Generate high and low
    const range = Math.abs(close - open) * (1 + Math.random())
    const high = Math.max(open, close) + Math.random() * range * 0.5
    const low = Math.min(open, close) - Math.random() * range * 0.5

    lastPriceRef.current = close

    return {
      id: candleIdRef.current++,
      x,
      open,
      high,
      low,
      close,
      isGreen: close > open,
    }
  }

  // Initialize candles
  useEffect(() => {
    if (dimensions.width === 0) return

    const candleWidth = window.innerWidth < 768 ? 3 : 4
    const candleSpacing = candleWidth + 1
    const candleCount = Math.ceil(dimensions.width / candleSpacing) + 5

    const initialCandles: Candle[] = []
    for (let i = 0; i < candleCount; i++) {
      const x = i * candleSpacing
      initialCandles.push(generateCandle(x))
    }

    setCandles(initialCandles)
  }, [dimensions.width])

  // Animation loop
  useEffect(() => {
    if (candles.length === 0) return

    const candleWidth = window.innerWidth < 768 ? 3 : 4
    const candleSpacing = candleWidth + 1
    let lastTime = 0

    const animate = (currentTime: number) => {
      if (currentTime - lastTime >= 500) {
        // New candle every 500ms
        setCandles((prevCandles) => {
          // Move all candles left
          const movedCandles = prevCandles.map((candle) => ({
            ...candle,
            x: candle.x - candleSpacing,
          }))

          // Remove candles that are off-screen
          const visibleCandles = movedCandles.filter((candle) => candle.x > -candleSpacing)

          // Add new candle on the right
          const rightmostX = Math.max(...visibleCandles.map((c) => c.x), -candleSpacing)
          const newCandle = generateCandle(rightmostX + candleSpacing)

          return [...visibleCandles, newCandle]
        })

        lastTime = currentTime
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [candles.length])

  if (dimensions.width === 0 || dimensions.height === 0) return null

  // Calculate price range for scaling
  const prices = candles.flatMap((c) => [c.high, c.low])
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice
  const padding = priceRange * 0.05

  const chartHeight = dimensions.height * 0.6 // 60% of screen height
  const chartTop = dimensions.height * 0.2 // Start at 20% from top

  const scaleY = (price: number) => {
    return chartTop + ((maxPrice + padding - price) / (priceRange + 2 * padding)) * chartHeight
  }

  const candleWidth = window.innerWidth < 768 ? 3 : 4

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />

      {/* Chart container with fade edges */}
      <div className="absolute inset-0" style={{ margin: "30px" }}>
        <div className="relative w-full h-full overflow-hidden">
          {/* Fade gradients */}
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-slate-950 to-transparent" />
            <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-slate-950 to-transparent" />
            <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-slate-950 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-slate-950 to-transparent" />
          </div>

          {/* SVG Chart */}
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="absolute inset-0"
            style={{ opacity: 0.15 }}
          >
            {candles.map((candle) => {
              const bodyTop = scaleY(Math.max(candle.open, candle.close))
              const bodyBottom = scaleY(Math.min(candle.open, candle.close))
              const bodyHeight = Math.max(1, bodyBottom - bodyTop)

              const wickTop = scaleY(candle.high)
              const wickBottom = scaleY(candle.low)

              const color = candle.isGreen ? "#10b981" : "#ef4444"

              return (
                <g key={candle.id}>
                  {/* Wick */}
                  <line
                    x1={candle.x + candleWidth / 2}
                    y1={wickTop}
                    x2={candle.x + candleWidth / 2}
                    y2={wickBottom}
                    stroke={color}
                    strokeWidth="1"
                    opacity="0.8"
                  />

                  {/* Body */}
                  <rect x={candle.x} y={bodyTop} width={candleWidth} height={bodyHeight} fill={color} opacity="0.9" />
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {/* Dark overlay for form contrast */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
    </div>
  )
}
