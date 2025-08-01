import type { Metadata } from "next"
import { MarketScannerPage } from "@/components/market-scanner-page"

export const metadata: Metadata = {
  title: "Market Scanner | Trading Journal",
  description: "Scan and discover trading opportunities in the market",
}

export default function MarketScanner() {
  return <MarketScannerPage />
}
