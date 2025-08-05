import type { Metadata } from "next"
import { TrendingTickersPage } from "@/components/trending-tickers-page"

export const metadata: Metadata = {
  title: "Trending Tickers | Trading Journal",
  description: "Discover trending stocks and market movers",
}

export default function TrendingTickers() {
  return <TrendingTickersPage />
}
