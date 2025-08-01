import type { Metadata } from "next"
import { DashboardPage } from "@/components/dashboard-page"

export const metadata: Metadata = {
  title: "Dashboard | Trading Journal",
  description: "Your trading dashboard overview",
}

export default function Dashboard() {
  return <DashboardPage />
}
