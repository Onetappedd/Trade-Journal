import type { Metadata } from "next"
import { AlertsPage } from "@/components/alerts-page"

export const metadata: Metadata = {
  title: "Price Alerts - Trading Journal",
  description: "Manage your price alerts and notifications",
}

export default function Alerts() {
  return <AlertsPage />
}
