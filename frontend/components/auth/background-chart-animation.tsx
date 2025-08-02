"use client"

import { useEffect, useRef } from "react"

export function BackgroundChartAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Generate random data points for the chart
    const generateDataPoints = (count: number) => {
      const points = []
      let value = 100
      for (let i = 0; i < count; i++) {
        value += (Math.random() - 0.5) * 10
        points.push({
          x: (i / count) * canvas.width,
          y: canvas.height / 2 + (value - 100) * 2,
        })
      }
      return points
    }

    let dataPoints = generateDataPoints(100)
    let animationFrame = 0

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, "rgba(59, 130, 246, 0.1)")
      gradient.addColorStop(1, "rgba(147, 51, 234, 0.1)")

      // Draw the chart line
      ctx.strokeStyle = "rgba(59, 130, 246, 0.3)"
      ctx.lineWidth = 2
      ctx.beginPath()

      dataPoints.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y)
        } else {
          ctx.lineTo(point.x, point.y)
        }
      })

      ctx.stroke()

      // Fill area under the curve
      ctx.fillStyle = gradient
      ctx.lineTo(canvas.width, canvas.height)
      ctx.lineTo(0, canvas.height)
      ctx.closePath()
      ctx.fill()

      // Animate the data points
      dataPoints = dataPoints.map((point) => ({
        ...point,
        y: point.y + Math.sin(animationFrame * 0.01 + point.x * 0.01) * 0.5,
      }))

      animationFrame++
      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return (
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-30" style={{ pointerEvents: "none" }} />
  )
}
