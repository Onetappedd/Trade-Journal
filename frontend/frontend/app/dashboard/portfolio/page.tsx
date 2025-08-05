import type { Metadata } from "next"
import { PortfolioPage } from "@/components/portfolio-page"

export const metadata: Metadata = {
  title: "Portfolio | Trading Journal",
  description: "View your live portfolio and current positions",
}

export default function Portfolio() {
  return <PortfolioPage />
}
