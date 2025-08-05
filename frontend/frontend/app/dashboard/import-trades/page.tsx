import type { Metadata } from "next"
import { ImportTradesPage } from "@/components/import-trades-page"

export const metadata: Metadata = {
  title: "Import Trades | Trading Journal",
  description: "Import trades from CSV files or broker APIs",
}

export default function ImportTrades() {
  return <ImportTradesPage />
}
