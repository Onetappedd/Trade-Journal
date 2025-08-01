import type { Metadata } from "next"
import { AddTradePage } from "@/components/add-trade-page"

export const metadata: Metadata = {
  title: "Add Trade | Trading Journal",
  description: "Record a new trade in your journal",
}

export default function AddTrade() {
  return <AddTradePage />
}
