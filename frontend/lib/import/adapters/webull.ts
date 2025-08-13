// Webull import adapter example
import type { Row } from "../types"
import type { NormalizedTrade } from "../types"

// Return confidence if a set of headers matches Webull download
export function detect(headers: string[]): number {
  const keys = ["Symbol", "Action", "Filled Quantity", "Fill Price", "Trade Time", "Account Number"]
  const matches = keys.filter(k => headers.some(h => h.toLowerCase().includes(k.toLowerCase())))
  return matches.length / keys.length
}

export function parse(rows: Row[]): NormalizedTrade[] {
  return rows.map((r) => {
    const symbol = String(r.Symbol || r["symbol"]).trim().toUpperCase()
    const side = (r.Action || r["action"] || '').toLowerCase().includes("buy") ? 'buy' : 'sell'
    const quantity = parseFloat(r["Filled Quantity"] || r["filled quantity"] || r.qty || r.Quantity)
    const entry_date = r["Trade Time"] || r["trade time"] || r.Date || r.date
    const price = parseFloat(r["Fill Price"] || r["fill price"] || r.price || r.Price)
    const account_external = r["Account Number"] || r["account number"]
    return {
      symbol,
      side,
      quantity,
      entry_date,
      entry_price: price,
      account_external,
      source_broker: "webull",
      raw: r
    } as NormalizedTrade
  })
}
