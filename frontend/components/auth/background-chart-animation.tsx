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

      // Draw grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
      ctx.lineWidth = 1

      // Vertical lines
      for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      // Horizontal lines
      for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Draw chart line
      ctx.strokeStyle = "rgba(59, 130, 246, 0.6)"
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

      // Draw area under the curve
      ctx.fillStyle = "rgba(59, 130, 246, 0.1)"
      ctx.beginPath()
      ctx.moveTo(dataPoints[0].x, canvas.height)
      dataPoints.forEach((point) => {
        ctx.lineTo(point.x, point.y)
      })
      ctx.lineTo(dataPoints[dataPoints.length - 1].x, canvas.height)
      ctx.closePath()
      ctx.fill()

      // Animate the data points
      animationFrame++
      if (animationFrame % 60 === 0) {
        dataPoints = generateDataPoints(100)
      }

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-30" style={{ zIndex: 1 }} />
}
