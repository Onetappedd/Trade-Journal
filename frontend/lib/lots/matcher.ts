// Lot matcher utility (FIFO, LIFO or AVERAGE)
import { parseFuturesRoot, getInstrumentMeta } from "@/lib/market/instruments"

export type LotMatchMethod = 'FIFO' | 'LIFO' | 'AVERAGE'

export interface Lot {
  id?: number
  symbol: string
  account_id?: string | null
  asset_class: string
  open_time: string
  qty_remaining: number
  cost_basis: number
  history: { qty: number; price: number; time: string }[]
}
export interface LotMatch {
  lot_id?: number
  close_trade_id?: number
  qty: number
  realized_pnl: number
  close_date: string
}

// trades: SORTED BY EFFECTIVE DATE ASC
export async function matchLots(trades: any[], method: LotMatchMethod = 'FIFO') {
  const lotBuckets: Record<string, Lot[]> = {}  // key is symbol:acct:asset_class
  const matches: LotMatch[] = []
  for (const trade of trades) {
    const symbol = (trade.symbol || '').toUpperCase()
    const acct = trade.account_id || 'default'
    const asset_class = (trade.asset_class || trade.asset_type || '').toLowerCase()
    const key = [symbol, acct, asset_class].join(':')
    if (!lotBuckets[key]) lotBuckets[key] = []
    // Lookup multiplier/point_value for this asset
    let multiplier = 1, option_multiplier = 100
    if (asset_class === 'futures') {
      const meta = await getInstrumentMeta(parseFuturesRoot(symbol), 'futures')
      multiplier = meta.point_value || 1
    } else if (asset_class === 'options') {
      const meta = await getInstrumentMeta(symbol, 'options')
      option_multiplier = meta.option_multiplier || 100
      multiplier = option_multiplier
    }
    const side = String(trade.side).toLowerCase()
    const qty = Number(trade.quantity) || 0
    const price = Number(trade.entry_price) || 0

    // Opening: buy=long, sell=short open
    if (
      (side === 'buy' && qty > 0 && (!trade.exit_price && !trade.exit_date)) ||
      (side === 'sell' && qty > 0 && trade.status === 'open')
    ) {
      const sign = side === 'sell' ? -1 : 1
      lotBuckets[key].push({
        symbol,
        asset_class,
        account_id: acct,
        open_time: trade.entry_date,
        qty_remaining: qty * sign,
        cost_basis: price,
        history: [{ qty: qty * sign, price, time: trade.entry_date }],
      })
      continue
    }

    // Closing logic
    let needsToMatch = qty
    let lots = lotBuckets[key]
    if (lots.length === 0) continue
    if (method === 'LIFO') lots = [...lots].reverse()
    if (method === 'AVERAGE') {
      const netQty = lots.reduce((a, l) => a + l.qty_remaining, 0)
      const totalCost = lots.reduce((a, l) => a + Math.abs(l.qty_remaining) * l.cost_basis, 0)
      lots = [{ ...lots[0], qty_remaining: netQty, cost_basis: totalCost / Math.abs(netQty || 1), history: lots.flatMap(l => l.history) }]
    }

    for (const lot of lots) {
      if (needsToMatch <= 0) break
      if (lot.qty_remaining === 0) continue
      const canClose = Math.min(Math.abs(lot.qty_remaining), needsToMatch) * Math.sign(lot.qty_remaining)
      const closeSide = Math.sign(lot.qty_remaining)
      let realized_pnl = 0
      if (closeSide > 0) {
        realized_pnl = (price - lot.cost_basis) * Math.abs(canClose) * multiplier // long close
      } else {
        realized_pnl = (lot.cost_basis - price) * Math.abs(canClose) * multiplier // short cover
      }
      matches.push({
        lot_id: lot.id,
        close_trade_id: trade.id as any,
        qty: Math.abs(canClose),
        realized_pnl,
        close_date: trade.exit_date || trade.effective_date || trade.entry_date,
      })
      lot.qty_remaining -= canClose
      needsToMatch -= Math.abs(canClose)
    }
    lotBuckets[key] = lots.filter(l => l.qty_remaining !== 0)
  }
  return matches
}
