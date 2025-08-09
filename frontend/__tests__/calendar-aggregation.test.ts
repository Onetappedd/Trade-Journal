import { describe, it, expect } from "vitest"

// Local copy of aggregation logic for unit testing (pure)
function toLocalKey(d: Date) {
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, "0")
  const day = `${d.getDate()}`.padStart(2, "0")
  return `${y}-${m}-${day}`
}

type T = {
  id: string
  side: "buy" | "sell"
  quantity: number
  entry_price: number
  exit_price: number | null
  entry_date: string
  exit_date: string | null
  status: "open" | "closed"
}

function aggregateRealized(trades: T[]) {
  const daily: Record<string, number> = {}
  for (const t of trades) {
    if (t.status !== "closed" || !t.exit_date || t.exit_price == null) continue
    const key = toLocalKey(new Date(t.exit_date))
    const realized = t.side === "buy"
      ? (t.exit_price - t.entry_price) * t.quantity
      : (t.entry_price - t.exit_price) * t.quantity
    daily[key] = (daily[key] || 0) + realized
  }
  return daily
}

describe("calendar aggregation", () => {
  it("sums multiple trades on the same day", () => {
    const trades: T[] = [
      { id: "1", side: "buy", quantity: 10, entry_price: 100, exit_price: 110, entry_date: "2024-01-01", exit_date: "2024-01-05T10:00:00Z", status: "closed" },
      { id: "2", side: "buy", quantity: 5, entry_price: 50, exit_price: 70, entry_date: "2024-01-04", exit_date: "2024-01-05T15:00:00Z", status: "closed" },
    ]
    const daily = aggregateRealized(trades)
    expect(Object.keys(daily).length).toBe(1)
    const k = toLocalKey(new Date("2024-01-05T00:00:00"))
    expect(Math.round(daily[k])).toBe(Math.round(10 * 10 + 5 * 20))
  })

  it("buckets across adjacent months correctly", () => {
    const trades: T[] = [
      { id: "1", side: "buy", quantity: 1, entry_price: 100, exit_price: 110, entry_date: "2024-01-31", exit_date: "2024-02-01T01:00:00Z", status: "closed" },
      { id: "2", side: "sell", quantity: 1, entry_price: 100, exit_price: 90, entry_date: "2024-02-01", exit_date: "2024-02-28T22:00:00Z", status: "closed" },
    ]
    const daily = aggregateRealized(trades)
    const k1 = toLocalKey(new Date("2024-02-01T00:00:00"))
    const k2 = toLocalKey(new Date("2024-02-28T00:00:00"))
    expect(daily[k1]).toBe(10)
    expect(daily[k2]).toBe(10) // sell short: entry 100 -> exit 90 => +10
  })

  it("ignores open trades and missing exit_price", () => {
    const trades: T[] = [
      { id: "1", side: "buy", quantity: 1, entry_price: 100, exit_price: null, entry_date: "2024-01-01", exit_date: null, status: "open" },
      { id: "2", side: "buy", quantity: 1, entry_price: 100, exit_price: null, entry_date: "2024-01-01", exit_date: "2024-01-02", status: "closed" },
    ]
    const daily = aggregateRealized(trades)
    expect(Object.keys(daily).length).toBe(0)
  })

  it("handles timezone midnight boundaries without shifting days", () => {
    const trades: T[] = [
      { id: "1", side: "buy", quantity: 1, entry_price: 100, exit_price: 110, entry_date: "2024-01-01", exit_date: new Date("2024-01-05T23:30:00").toISOString(), status: "closed" },
      { id: "2", side: "buy", quantity: 1, entry_price: 100, exit_price: 120, entry_date: "2024-01-01", exit_date: new Date("2024-01-05T00:30:00").toISOString(), status: "closed" },
    ]
    const daily = aggregateRealized(trades)
    const k = toLocalKey(new Date("2024-01-05T00:00:00"))
    expect(daily[k]).toBeCloseTo(30)
  })
})
