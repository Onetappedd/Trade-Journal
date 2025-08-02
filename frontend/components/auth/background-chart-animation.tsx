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

    // Generate random data points
    const dataPoints = Array.from({ length: 50 }, (_, i) => ({
      x: (i / 49) * canvas.width,
      y: Math.random() * canvas.height * 0.6 + canvas.height * 0.2,
    }))

    let animationFrame: number

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw grid lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
      ctx.lineWidth = 1

      // Vertical lines
      for (let i = 0; i < 10; i++) {
        const x = (i / 9) * canvas.width
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      // Horizontal lines
      for (let i = 0; i < 6; i++) {
        const y = (i / 5) * canvas.height
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Draw chart line
      ctx.strokeStyle = "rgba(59, 130, 246, 0.5)"
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

      // Animate data points slightly
      dataPoints.forEach((point) => {
        point.y += (Math.random() - 0.5) * 0.5
        point.y = Math.max(canvas.height * 0.1, Math.min(canvas.height * 0.9, point.y))
      })

      animationFrame = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationFrame)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-30" style={{ zIndex: -1 }} />
}
