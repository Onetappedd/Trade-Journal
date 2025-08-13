"use client"
import { PDFDownloadLink } from "@react-pdf/renderer"
import { AnalyticsReportPDF } from "./AnalyticsReportPDF"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"

export function ReportButton({ data }: { data: any }) {
  return (
    <PDFDownloadLink document={<AnalyticsReportPDF data={data}/>} fileName="analytics-report.pdf">
      {({ loading }) => (
        <Button aria-label="Generate analytics PDF report" className="gap-2" disabled={loading} variant="outline">
          <FileText className="h-4 w-4" />
          {loading ? "Preparing PDF..." : "Export PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  )
}
