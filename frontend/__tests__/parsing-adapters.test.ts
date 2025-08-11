import { describe, it, expect } from "vitest"
import { getAdapters, detectAdapter, type DetectionResult } from "@/lib/import/parsing/engine"

function makeHeaders(...cols: string[]) { return cols }

describe("parsing adapters - detection + parsing", () => {
  it("ibkr: detects and parses options with OCC string, quantity x100 and contracts note", () => {
    const headers = makeHeaders("Date/Time","Symbol","Quantity","T. Price","Comm/Fee","Description")
    const rows = [{
      "Date/Time": "2024-09-20 15:30:00",
      "Symbol": "AAPL",
      "Quantity": 2,
      "T. Price": "1.23",
      "Comm/Fee": "1.50",
      "Description": "AAPL 240920C00185000"
    }]
    const det = detectAdapter(headers, rows) as DetectionResult
    expect(det?.brokerId).toBe("ibkr")
    expect(det?.assetClass).toBe("options")

    // Use detected adapter parse
    const adapter = getAdapters().find(a => a.id === det!.brokerId)!
    const { fills, errors } = adapter.parse({ rows, headerMap: det!.headerMap, userTimezone: "America/New_York", assetClass: det!.assetClass })
    expect(errors.length).toBe(0)
    expect(fills.length).toBe(1)
    const f = fills[0]
    expect(f.symbol).toContain("AAPL")
    expect(f.right).toBe("C")
    expect(f.expiry).toMatch(/\d{4}-\d{2}-\d{2}/)
    expect(f.quantity).toBe(200) // 2 contracts x 100
    expect(f.notes).toContain("contracts:2")
    expect(f.fees).toBeGreaterThan(0)
  })

  it("schwab: parses decimal comma numbers and infers side/qty", () => {
    const headers = makeHeaders("Trade Date","Action","Symbol","Quantity","Price","Fees & Comm")
    const rows = [{ "Trade Date": "2024-01-05", Action: "Buy", Symbol: "MSFT", Quantity: "10", Price: "1.234,56", "Fees & Comm": "0,50" }]
    const det = detectAdapter(headers, rows)!
    expect(det.brokerId).toBe("schwab")
    const adapter = getAdapters().find(a => a.id === det.brokerId)!
    const { fills } = adapter.parse({ rows, headerMap: det.headerMap, userTimezone: "America/New_York", assetClass: det.assetClass })
    expect(fills[0].price).toBeCloseTo(1234.56)
    expect(fills[0].quantity).toBe(10)
    expect(fills[0].fees).toBeCloseTo(0.5)
  })

  it("webull: detection works and parses fees sum", () => {
    const headers = makeHeaders("Time Executed","Symbol","Side","Quantity","Avg Price","Commission","Regulatory Fees")
    const rows = [{ "Time Executed": "2024-02-01 10:00:00", Symbol: "TSLA", Side: "SELL", Quantity: "3", "Avg Price": "210.10", Commission: "0.35", "Regulatory Fees": "0.02" }]
    const det = detectAdapter(headers, rows)!
    expect(det.brokerId).toBe("webull")
    const { fills } = getAdapters().find(a => a.id === "webull")!.parse({ rows, headerMap: det.headerMap, userTimezone: "America/New_York", assetClass: det.assetClass })
    expect(fills[0].fees).toBeCloseTo(0.37, 2)
    expect(fills[0].quantity).toBeLessThan(0) // SELL => negative qty convention
  })

  it("robinhood: detects missing time header (using date only) and parses", () => {
    const headers = makeHeaders("Date","Symbol","Side","Quantity","Price","Fees")
    const rows = [{ Date: "2024-03-10", Symbol: "AAPL", Side: "Buy", Quantity: "1", Price: "180", Fees: "0" }]
    const det = detectAdapter(headers, rows)!
    expect(det.brokerId).toBe("robinhood")
    const { fills } = getAdapters().find(a => a.id === "robinhood")!.parse({ rows, headerMap: det.headerMap, userTimezone: "America/New_York", assetClass: det.assetClass })
    expect(fills[0].execTime).toMatch(/T/) // ISO
  })

  it("fidelity: detection works with settlement date and parses", () => {
    const headers = makeHeaders("Settlement Date","Symbol","Action","Quantity","Price","Commission","Fees")
    const rows = [{ "Settlement Date": "2024-04-01", Symbol: "GOOG", Action: "Sell", Quantity: "5", Price: "130.5", Commission: "0.00", Fees: "0.01" }]
    const det = detectAdapter(headers, rows)!
    expect(det.brokerId).toBe("fidelity")
    const { fills } = getAdapters().find(a => a.id === "fidelity")!.parse({ rows, headerMap: det.headerMap, userTimezone: "America/New_York", assetClass: det.assetClass })
    expect(fills[0].quantity).toBeLessThan(0)
    expect(fills[0].fees).toBeCloseTo(0.01)
  })

  it("etrade: parses action and sums fees", () => {
    const headers = makeHeaders("Transaction Date","Symbol","Action","Quantity","Price","Commission","Fees")
    const rows = [{ "Transaction Date": "2024-05-10 13:45:12", Symbol: "NFLX", Action: "Buy", Quantity: "2", Price: "500", Commission: "0.99", Fees: "0.02" }]
    const det = detectAdapter(headers, rows)!
    const { fills } = getAdapters().find(a => a.id === det.brokerId)!.parse({ rows, headerMap: det.headerMap, userTimezone: "America/New_York", assetClass: det.assetClass })
    expect(fills[0].fees).toBeCloseTo(1.01)
  })

  it("tastytrade: options explicitly mapped fields, contracts note", () => {
    const headers = makeHeaders("Fill Time","Symbol","Underlying","Type","Strike","Expiry","Quantity","Price","Fees","Commission")
    const rows = [{ "Fill Time": "2024-06-10 12:00:00", Symbol: "AAPL", Underlying: "AAPL", Type: "Call", Strike: "180", Expiry: "2024-06-21", Quantity: "1", Price: "1.00", Fees: "1.00", Commission: "0.15" }]
    const det = detectAdapter(headers, rows)!
    expect(det.brokerId).toBe("tastytrade")
    const { fills } = getAdapters().find(a => a.id === "tastytrade")!.parse({ rows, headerMap: det.headerMap, userTimezone: "America/New_York", assetClass: det.assetClass })
    expect(fills[0].quantity).toBe(100)
    expect(fills[0].right).toBe("C")
    expect(fills[0].notes).toContain("contracts:1")
  })

  it("tradestation: detects and parses", () => {
    const headers = makeHeaders("Execution Date","Symbol","Side","Quantity","Price","Commission","Sec Fee","NFA Fee")
    const rows = [{ "Execution Date": "2024-07-15 09:35:00", Symbol: "QQQ", Side: "Sell", Quantity: "10", Price: "400", "Commission": "1.00", "Sec Fee": "0.01", "NFA Fee": "0.02" }]
    const det = detectAdapter(headers, rows)!
    const { fills } = getAdapters().find(a => a.id === det.brokerId)!.parse({ rows, headerMap: det.headerMap, userTimezone: "America/New_York", assetClass: det.assetClass })
    expect(fills[0].fees).toBeCloseTo(1.03)
  })

  it("coinbase: detects and notes non-USD fee currency", () => {
    const headers = makeHeaders("Timestamp","Product","Side","Size","Price","Fee","Fee Currency","Total")
    const rows = [{ Timestamp: "2024-08-01T10:00:00Z", Product: "BTC-USD", Side: "Buy", Size: "0.01", Price: "45,000.00", Fee: "0.50", "Fee Currency": "EUR" }]
    const det = detectAdapter(headers, rows)!
    const { fills } = getAdapters().find(a => a.id === det.brokerId)!.parse({ rows, headerMap: det.headerMap, userTimezone: "UTC", assetClass: det.assetClass })
    expect(fills[0].notes).toContain("fee_ccy:EUR")
  })

  it("kraken: detects and parses decimal comma amounts", () => {
    const headers = makeHeaders("Timestamp","Market","Side","Amount","Price","Fee","Fee Currency")
    const rows = [{ Timestamp: "2024-08-01 12:00:00", Market: "ETHUSD", Side: "Sell", Amount: "1,5", Price: "3.123,45", Fee: "0,25", "Fee Currency": "USD" }]
    const det = detectAdapter(headers, rows)!
    const { fills } = getAdapters().find(a => a.id === det.brokerId)!.parse({ rows, headerMap: det.headerMap, userTimezone: "UTC", assetClass: det.assetClass })
    expect(fills[0].price).toBeCloseTo(3123.45)
    expect(fills[0].quantity).toBeLessThan(0)
  })

  it("binanceus: detects and parses", () => {
    const headers = makeHeaders("Timestamp","Symbol","Side","Quantity","Price","Fee","Fee Currency")
    const rows = [{ Timestamp: "2024-01-01 00:00:00", Symbol: "XBTUSD", Side: "Buy", Quantity: "0.002", Price: "45000", Fee: "0.10", "Fee Currency": "USD" }]
    const det = detectAdapter(headers, rows)!
    const { fills } = getAdapters().find(a => a.id === det.brokerId)!.parse({ rows, headerMap: det.headerMap, userTimezone: "UTC", assetClass: det.assetClass })
    expect(fills[0].symbol).toBe("BTC-USD")
  })

  it("futures: basic canonicalization and DST-safe execTime ISO", () => {
    const headers = makeHeaders("Date/Time","Symbol","Quantity","T. Price")
    const rows = [{ "Date/Time": "2024-11-03 01:30:00", Symbol: "NQZ4", Quantity: "1", "T. Price": "16000" }]
    const det = detectAdapter(headers, rows)!
    // Force futures asset class
    det.assetClass = "futures"
    const { fills } = getAdapters().find(a => a.id === det.brokerId)!.parse({ rows, headerMap: det.headerMap, userTimezone: "America/New_York", assetClass: "futures" })
    expect(fills[0].symbol).toBe("NQZ4")
    expect(fills[0].execTime).toMatch(/T/) // ISO
  })
})
