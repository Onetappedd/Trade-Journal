import type { Metadata } from "next"
import { AnalyticsPage } from "@/components/analytics-page"

export const metadata: Metadata = {
  title: "Analytics | Trading Journal",
  description: "Detailed analytics and performance metrics for your trading",
}

export default function Analytics() {
  return <AnalyticsPage />
}
