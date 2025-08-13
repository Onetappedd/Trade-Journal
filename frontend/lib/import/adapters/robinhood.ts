// Robinhood import adapter example
import type { Row } from "../types"
import type { NormalizedTrade } from "../types"

export function detect(headers: string[]): number {
  const keys = ["Symbol", "Side", "Quantity", "Price", "Date"]
  const matches = keys.filter(k => headers.some(h => h.toLowerCase().includes(k.toLowerCase())))
  return matches.length / keys.length
}

export function parse(rows: Row[]): NormalizedTrade[] {
  return rows.map((r) => {
    const symbol = String(r.Symbol || r["symbol"]).trim().toUpperCase()
    const side = (r.Side || r["side"] || '').toLowerCase().includes("buy") ? 'buy' : 'sell'
    const quantity = parseFloat(r["Quantity"] || r.quantity)
    const entry_date = r["Date"] || r.date
    const price = parseFloat(r["Price"] || r.price)
    const account_external = r["Account Number"] || r["account number"]
    return {
      symbol,
      side,
      quantity,
      entry_date,
      entry_price: price,
      account_external,
      source_broker: "robinhood",
      raw: r
    } as NormalizedTrade
  })
}
