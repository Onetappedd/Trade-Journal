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
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
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
          x: (i / (count - 1)) * canvas.width,
          y: canvas.height - (value / 200) * canvas.height,
        })
      }
      return points
    }

    let animationFrame: number
    let offset = 0

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw multiple chart lines
      const colors = ["rgba(59, 130, 246, 0.3)", "rgba(16, 185, 129, 0.3)", "rgba(245, 101, 101, 0.3)"]

      colors.forEach((color, index) => {
        const points = generateDataPoints(50)

        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.beginPath()

        points.forEach((point, i) => {
          const x = point.x + offset * (index + 1) * 0.5
          const y = point.y + Math.sin((offset + i) * 0.02) * 20

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        })

        ctx.stroke()
      })

      offset += 1
      animationFrame = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationFrame)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-30"
      style={{ background: "transparent" }}
    />
  )
}
