"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"

export const BackgroundChartAnimation = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let candles: any[] = []
    const candleWidth = 10
    const candleSpacing = 5
    const totalCandleSpace = candleWidth + candleSpacing
    let frameCounter = 0
    const animationSpeed = 4 // Faster update speed (lower is faster)

    const colors = {
      grid: resolvedTheme === "dark" ? "rgba(255, 255, 255, 0.07)" : "rgba(0, 0, 0, 0.07)",
      green: "rgba(16, 185, 129, 0.7)",
      red: "rgba(239, 68, 68, 0.7)",
      wick: resolvedTheme === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
    }

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initializeCandles()
    }

    const initializeCandles = () => {
      candles = []
      const candleCount = Math.ceil(canvas.width / totalCandleSpace) + 1
      let currentPrice = canvas.height / 2

      for (let i = 0; i < candleCount; i++) {
        const open = currentPrice
        const close = open + (Math.random() - 0.5) * 30
        const high = Math.max(open, close) + Math.random() * 20
        const low = Math.min(open, close) - Math.random() * 20
        candles.push({ open, close, high, low })
        currentPrice = close
      }
    }

    const drawGrid = () => {
      ctx.strokeStyle = colors.grid
      ctx.lineWidth = 0.5

      for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }
    }

    const drawCandles = () => {
      candles.forEach((candle, i) => {
        const x = i * totalCandleSpace
        const isUp = candle.close >= candle.open

        ctx.strokeStyle = colors.wick
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(x + candleWidth / 2, candle.high)
        ctx.lineTo(x + candleWidth / 2, candle.low)
        ctx.stroke()

        ctx.fillStyle = isUp ? colors.green : colors.red
        const bodyHeight = Math.abs(candle.open - candle.close)
        const bodyY = isUp ? candle.close : candle.open
        ctx.fillRect(x, bodyY, candleWidth, Math.max(bodyHeight, 1))
      })
    }

    const updateCandles = () => {
      candles.shift()

      const lastCandle = candles[candles.length - 1]
      const open = lastCandle.close

      const volatility = 25
      const upperBound = canvas.height * 0.85
      const lowerBound = canvas.height * 0.15
      let reversionFactor = 0.5

      if (open > upperBound) {
        reversionFactor = 0.6
      } else if (open < lowerBound) {
        reversionFactor = 0.4
      }

      const change = (Math.random() - reversionFactor) * volatility
      let close = open + change

      close = Math.max(10, Math.min(canvas.height - 10, close))

      const high = Math.max(open, close) + Math.random() * 15
      const low = Math.min(open, close) - Math.random() * 15
      candles.push({ open, close, high, low })
    }

    const animate = () => {
      frameCounter++
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawGrid()
      drawCandles()

      if (frameCounter % animationSpeed === 0) {
        updateCandles()
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [resolvedTheme])

  return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0 opacity-50" />
}
