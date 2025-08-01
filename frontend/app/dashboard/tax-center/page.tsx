import type { Metadata } from "next"
import { TaxCenterPage } from "@/components/tax-center-page"

export const metadata: Metadata = {
  title: "Tax Center | Trading Journal",
  description: "Manage your tax-related trading information and reports",
}

export default function TaxCenter() {
  return <TaxCenterPage />
}
