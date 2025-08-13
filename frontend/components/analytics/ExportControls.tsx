"use client"
import { exportToCsv } from "@/lib/utils/exportToCsv"
import { Button } from "@/components/ui/button"
import { Download, Image } from "lucide-react"

export function ExportControls({ data, chartId }: { data: any[]; chartId?: string }) {
  return (
    <div className="flex items-center gap-2 my-2">
      <Button aria-label="Export as CSV" onClick={() => exportToCsv(data, "analytics.csv") } variant="outline">
        <Download className="h-4 w-4 mr-1" />Export CSV
      </Button>
      {chartId && (
        <Button aria-label="Export chart as PNG" onClick={async () => {
          const el = document.getElementById(chartId)
          if (!el) return
          const html2canvas = (await import('html2canvas')).default
          html2canvas(el).then(canvas => {
            canvas.toBlob(blob => {
              if (!blob) return
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url; a.download = "chart.png"
              document.body.appendChild(a)
              a.click()
              URL.revokeObjectURL(url)
              a.remove()
            })
          })
        }} variant="outline">
          <Image className="h-4 w-4 mr-1" />Export PNG
        </Button>
      )}
    </div>
  )
}
