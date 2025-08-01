import type { Metadata } from "next"
import { ReportsPage } from "@/components/reports-page"

export const metadata: Metadata = {
  title: "Reports | Trading Journal",
  description: "Generate detailed trading reports and analysis",
}

export default function Reports() {
  return <ReportsPage />
}
