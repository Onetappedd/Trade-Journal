import type { Metadata } from "next"
import { TradeHistoryPage } from "@/components/trade-history-page"

export const metadata: Metadata = {
  title: "Trade History | Trading Journal",
  description: "View and manage your complete trading history",
}

export default function TradeHistory() {
  return <TradeHistoryPage />
}
