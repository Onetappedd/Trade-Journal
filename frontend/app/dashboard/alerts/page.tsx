import type { Metadata } from "next"
import { AlertsPage } from "@/components/alerts-page"

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Price Alerts - Trading Journal",
  description: "Manage your price alerts and notifications",
}

export default function Alerts() {
  return <AlertsPage />
}
