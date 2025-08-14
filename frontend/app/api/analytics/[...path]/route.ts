import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { z } from 'zod'
import { format, addDays, isBefore, parseISO } from 'date-fns'
import { utcToZonedTime, zonedTimeToUtc, formatInTimeZone } from 'date-fns-tz'
import type { Database } from '@/lib/database.types'
import { CardsSummarySchema, EquityCurveResponseSchema, MonthlyPnlResponseSchema } from '@/lib/analytics/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const FiltersSchema = z.object({
  accountIds: z.array(z.string()).optional().default([]),
  assetClasses: z.array(z.enum(['stocks','options','futures','crypto'])).optional().default([]),
  start: z.string().optional(), // YYYY-MM-DD
  end: z.string().optional(),   // YYYY-MM-DD
  timezone: z.string().optional(),
  symbols: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  strategies: z.array(z.string()).optional().default([]),
})

const FUTURE_POINT_VALUE: Record<string, number> = {
  ES: 50, MES: 5, NQ: 20, MNQ: 2, YM: 5, MYM: 0.5, RTY: 50, M2K: 5, CL: 1000, GC: 100, SI: 5000, ZB: 1000,
}

function futuresPointValue(symbol: string | null): number {
  if (!symbol) return 1
  const root = symbol.replace(/[0-9]/g, '').slice(0, 3).toUpperCase()
  return FUTURE_POINT_VALUE[root] ?? 1
}

function tradePnl(t: any): number {
  const qty = Number(t.quantity ?? 0)
  const entry = Number(t.entry_price ?? 0)
  const exit = Number(t.exit_price ?? 0)
  const fees = Number(t.fees ?? 0)
  const at = String(t.asset_type || t.asset_class || '').toLowerCase()
  switch (at) {
    case 'options':
      return (exit - entry) * qty * 100 - fees
    case 'futures': {
      const pv = futuresPointValue(t.symbol)
      return (exit - entry) * pv * qty - fees
    }
    case 'stocks':
    case 'crypto':
    default:
      return (exit - entry) * qty - fees
  }
}

function tzDay(ts: string, tz: string): string {
  const d = utcToZonedTime(new Date(ts), tz)
  return format(d, 'yyyy-MM-dd')
}

function fillDays(start: string, end: string): string[] {
  const out: string[] = []
  let d = parseISO(start)
  const e = parseISO(end)
  while (!isBefore(e, d)) {
    out.push(format(d, 'yyyy-MM-dd'))
    d = addDays(d, 1)
  }
  return out
}

export async function POST(req: NextRequest, { params }: { params: { path?: string[] } }) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const path = params.path ?? []
  const raw = await req.json().catch(() => ({}))
  const parsed = FiltersSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid filters', details: parsed.error.flatten() }, { status: 400 })
  }
  const filters = parsed.data
  const tz = filters.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone

  const today = format(new Date(), 'yyyy-MM-dd')
  const defaultStart = format(addDays(new Date(), -90), 'yyyy-MM-dd')
  const start = filters.start ?? defaultStart
  const end = filters.end ?? today

  // Base query on trades_view with effective_date
  let q = supabase
    .from('trades_view')
    .select('*')
    .eq('user_id', user.id)
    .gte('effective_date', start)
    .lte('effective_date', end)

  if (filters.accountIds && filters.accountIds.length) q = q.in('account_id', filters.accountIds)
  if (filters.assetClasses && filters.assetClasses.length) q = q.in('asset_type', filters.assetClasses)
  if (filters.symbols && filters.symbols.length) q = q.in('symbol', filters.symbols.map(s => s.toUpperCase()))
  // tags/strategies filters can be added via joins if schema supports

  // Only realized (closed) trades for performance analytics
  const { data: trades, error } = await q
    .neq('exit_price', null)
    .order('effective_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // EQUITY CURVE
  if (path[0] === 'equity-curve' || path[0] === 'monthly-pnl') {
    // 1. Fetch daily PnL from function (for P&L only, not income)
    const { data: settings } = await supabase
      .from('user_settings')
      .select('initial_capital')
      .eq('user_id', user.id)
      .maybeSingle()
    const initial = Number(settings?.initial_capital ?? 10000)
    const { data: pnlRows, error: pnlError } = await supabase.rpc('analytics_daily_pnl', {
      p_user: user.id,
      p_start: start,
      p_end: end,
      p_tz: tz,
    })
    if (pnlError) return NextResponse.json({ error: pnlError.message }, { status: 500 })
    // 2. Fetch cash flows (dividends/income)
    const { data: cashFlows } = await supabase
      .from('cash_flows')
      .select('date,amount,type')
      .eq('user_id', user.id)
      .gte('date', start)
      .lte('date', end)
    // 3. Merge by date
    const cfByDay: Record<string, number> = {}
    for (const c of cashFlows ?? []) {
      cfByDay[c.date] = (cfByDay[c.date] || 0) + Number(c.amount ?? 0)
    }

    // Merge into daily series
    let equity = initial
    let runMax = initial
    let maxDD = 0
    const dataPoints: { date: string; value: number; percentChange: number; dollarChange: number; income: number }[] = []
    for (const row of pnlRows ?? []) {
      const income = cfByDay[row.day] ?? 0
      equity += Number(row.pnl ?? 0) + income
      runMax = Math.max(runMax, equity)
      const dd = equity - runMax
      if (dd < maxDD) maxDD = dd
      const dollarChange = equity - initial
      const percentChange = initial === 0 ? 0 : (dollarChange / initial) * 100
      dataPoints.push({
        date: row.day,
        value: Number(equity.toFixed(2)),
        dollarChange: Number(dollarChange.toFixed(2)),
        percentChange: Number(percentChange.toFixed(4)),
        income: Number(income.toFixed(2))
      })
    }

    if (path[0] === 'equity-curve') {
      const payload = { ok: true, data: dataPoints }
      const parsedOut = EquityCurveResponseSchema.safeParse(payload)
      if (!parsedOut.success) {
        return NextResponse.json({ error: 'Invalid data shape', issues: parsedOut.error.flatten() }, { status: 500 })
      }
      return NextResponse.json(parsedOut.data)
    } else {
      // monthly-pnl
      const byMonth: Record<string, number> = {}
      const byMonthIncome: Record<string, number> = {}
      for (const row of dataPoints) {
        const d = new Date(row.date)
        const month = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-01`
        byMonth[month] = (byMonth[month] || 0) + Number((row.value - initial) + row.income - (byMonth[month] || 0)) // focus: sum equity net change+income for month
        byMonthIncome[month] = (byMonthIncome[month] || 0) + row.income
      }
      const months = Object.keys(byMonth).sort().map(m => ({ month: m, pnl: Number(byMonth[m].toFixed(2)), income: Number((byMonthIncome[m]||0).toFixed(2)) }))
      const total = Number(months.reduce((a,x)=>a+x.pnl,0).toFixed(2))
      const avgMonthly = months.length ? Number((total / months.length).toFixed(2)) : 0
      const out = { ok: true, data: { months, total, avgMonthly } }
      const parsed = MonthlyPnlResponseSchema.safeParse(out)
      if (!parsed.success) return NextResponse.json({ error: 'Invalid shape', details: parsed.error.flatten() }, { status: 500 })
      return NextResponse.json(parsed.data)
    }
  }

  // MONTHLY PNL
  if (path[0] === 'monthly-pnl') {
    // Use analytics_daily_pnl then node group
    const { data: pnlRows, error: pnlError } = await supabase.rpc('analytics_daily_pnl', {
      p_user: user.id,
      p_start: start,
      p_end: end,
      p_tz: tz,
    })
    if (pnlError) return NextResponse.json({ error: pnlError.message }, { status: 500 })
    // Group by month bucket (YYYY-MM-01)
    const byMonth: Record<string, number> = {}
    for (const row of pnlRows ?? []) {
      const d = new Date(row.day)
      const month = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-01`
      byMonth[month] = (byMonth[month] || 0) + Number(row.pnl ?? 0)
    }
    const months = Object.keys(byMonth).sort().map(m => ({ month: m, pnl: Number(byMonth[m].toFixed(2)) }))
    const total = Number(months.reduce((a,x)=>a+x.pnl,0).toFixed(2))
    const avgMonthly = months.length ? Number((total / months.length).toFixed(2)) : 0
    const out = { ok: true, data: { months, total, avgMonthly } }
    const parsed = MonthlyPnlResponseSchema.parse(out)
    return NextResponse.json(parsed)
  }

  // CARDS
  if (path[0] === 'cards') {
    const { data: settings } = await supabase
      .from('user_settings')
      .select('initial_capital')
      .eq('user_id', user.id)
      .maybeSingle()
    const initial = Number(settings?.initial_capital ?? 10000)

    let realized = 0, feesTot = 0, wins = 0, losses = 0
    let sumWin = 0, sumLossAbs = 0

    const daily: Record<string, number> = {}
    for (const t of (trades ?? [])) {
      const pnl = tradePnl(t)
      realized += pnl
      feesTot += Number((t as any).fees ?? 0)
      if (pnl > 0) { wins++; sumWin += pnl }
      else if (pnl < 0) { losses++; sumLossAbs += Math.abs(pnl) }
      const day = tzDay((t as any).effective_date ?? (t as any).exit_date ?? (t as any).entry_date, tz)
      daily[day] = (daily[day] ?? 0) + pnl
    }

    const days = fillDays(start, end)
    let equity = initial
    let prevEquity = initial
    const dayReturns: number[] = []
    for (const d of days) {
      const pnl = daily[d] ?? 0
      equity += pnl
      const ret = prevEquity === 0 ? 0 : (equity - prevEquity) / prevEquity
      dayReturns.push(ret)
      prevEquity = equity
    }

    const tradeCount = (trades ?? []).length
    const net = realized
    const winRate = tradeCount ? wins / tradeCount : 0
    const avgWin = wins ? sumWin / wins : 0
    const avgLoss = losses ? sumLossAbs / losses : 0
    const expectancy = winRate * avgWin - (1 - winRate) * avgLoss
    const profitFactor = sumLossAbs === 0 ? (sumWin > 0 ? Infinity : 0) : sumWin / sumLossAbs

    const avg = dayReturns.length ? dayReturns.reduce((a, b) => a + b, 0) / dayReturns.length : 0
    const variance = dayReturns.length ? dayReturns.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / dayReturns.length : 0
    const stddev = Math.sqrt(variance)
    const downside = dayReturns.filter(r => r < 0)
    const dAvg = downside.length ? downside.reduce((a,b)=>a+b,0)/downside.length : 0
    const dVar = downside.length ? downside.reduce((a,b)=>a+Math.pow(b - dAvg,2),0)/downside.length : 0
    const dStd = Math.sqrt(dVar)
    const annual = Math.sqrt(252)
    const sharpe = stddev === 0 ? 0 : (avg / stddev) * annual
    const sortino = dStd === 0 ? 0 : (avg / dStd) * annual

    const payload = {
      ok: true,
      data: {
        net: Number(net.toFixed(2)),
        realized: Number(realized.toFixed(2)),
        fees: Number(feesTot.toFixed(2)),
        winRate: Number(winRate),
        avgWin: Number(avgWin.toFixed(2)),
        avgLoss: Number(avgLoss.toFixed(2)),
        expectancy: Number(expectancy.toFixed(2)),
        profitFactor: Number(profitFactor === Infinity ? Number.MAX_SAFE_INTEGER : profitFactor.toFixed(2)),
        tradeCount,
        maxDrawdown: 0, // optional: compute from equity series if needed
        sharpe: Number(sharpe.toFixed(2)),
        sortino: Number(sortino.toFixed(2)),
      }
    }

    const parsedOut = CardsSummarySchema.parse(payload)
    return NextResponse.json(parsedOut)
  }

  // symbols-breakdown: per-symbol metrics
  const subpath = path.join('/')
  if (subpath === 'symbols-breakdown') {
    // realized (closed) trades only
    const symbols: Record<string, { symbol: string, trades: number, pnl: number, wins: number, losses: number, winTradePnl: number, lossTradePnl: number }> = {}
    for (const t of (trades ?? [])) {
      const symbol = (t.symbol || '').toUpperCase()
      const pnl = tradePnl(t)
      if (!symbols[symbol]) symbols[symbol] = { symbol, trades: 0, pnl: 0, wins: 0, losses: 0, winTradePnl: 0, lossTradePnl: 0 }
      symbols[symbol].trades++
      symbols[symbol].pnl += pnl
      if (pnl > 0) { symbols[symbol].wins++; symbols[symbol].winTradePnl += pnl }
      if (pnl < 0) { symbols[symbol].losses++; symbols[symbol].lossTradePnl += Math.abs(pnl) }
    }
    const breakdown = Object.values(symbols).map(s => ({
      symbol: s.symbol,
      trades: s.trades,
      pnl: Number(s.pnl.toFixed(2)),
      win_rate: s.wins + s.losses > 0 ? s.wins / (s.wins + s.losses) : 0,
      avg_win: s.wins ? Number((s.winTradePnl / s.wins).toFixed(2)) : 0,
      avg_loss: s.losses ? Number((s.lossTradePnl / s.losses).toFixed(2)) : 0,
    }))
    breakdown.sort((a, b) => b.pnl - a.pnl)
    return NextResponse.json({
      ok: true,
      data: {
        top: breakdown.slice(0, 10),
        bottom: breakdown.slice(-10)
      }
    })
  }

  if (subpath === 'trade-quality') {
    // Realized trades
    let wins: number[] = [], losses: number[] = [], holdingHrs: number[] = []
    for (const t of (trades ?? [])) {
      const pnl = tradePnl(t)
      if (pnl > 0) wins.push(pnl)
      if (pnl < 0) losses.push(pnl)
      let start = new Date(t.entry_date || t.effective_date || t.exit_date)
      let end = new Date(t.exit_date || t.effective_date || t.entry_date)
      let hours = Math.abs((end.getTime() - start.getTime())/1000/60/60)
      holdingHrs.push(hours)
    }
    // Expectancy, profit factor
    const avgWin = wins.length ? wins.reduce((a, b) => a + b, 0) / wins.length : 0
    const avgLoss = losses.length ? Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length) : 0
    const winRate = (wins.length + losses.length) > 0 ? wins.length / (wins.length + losses.length) : 0
    const expectancy = winRate * avgWin - (1 - winRate) * avgLoss
    const profitFactor = losses.length === 0 ? (wins.length > 0 ? Infinity : 0) : wins.reduce((a, b) => a + b, 0) / Math.abs(losses.reduce((a, b) => a + b, 0))
    // Holding time stats
    holdingHrs.sort((a,b)=>a-b)
    const meanHrs = holdingHrs.length? holdingHrs.reduce((a,b)=>a+b,0)/holdingHrs.length : 0
    const medianHrs = holdingHrs.length? (holdingHrs[Math.floor(holdingHrs.length/2)] + holdingHrs[Math.ceil(holdingHrs.length/2) - 1]) / 2 : 0
    // Histogram bins
    const bins = [1, 4, 24, 72, 168]
    const holdingHist: Record<string, number> = {}
    for (const h of holdingHrs) {
      let bucket = h < 1 ? '0-1h' : h < 4 ? '1-4h' : h < 24 ? '4-24h' : h < 72 ? '1-3d' : h < 168 ? '3-7d' : '7d+'
      holdingHist[bucket] = (holdingHist[bucket]||0)+1
    }
    // Outcome histogram in $ PnL buckets
    const outcomeBuckets = [ -200, -50, 0, 50, 200 ]
    const outcomeHist: Record<string, number> = {}
    for (const t of (trades ?? [])) {
      const pnl = tradePnl(t)
      let bucket = pnl < -200 ? '<$-200' : pnl < -50 ? '-200..-50' : pnl < 0 ? '-50..0' : pnl < 50 ? '0..50' : pnl < 200 ? '50..200' : '>$200'
      outcomeHist[bucket] = (outcomeHist[bucket] || 0) + 1
    }
    return NextResponse.json({
      ok: true,
      data: {
        expectancy: Number(expectancy.toFixed(2)),
        profit_factor: Number(profitFactor === Infinity ? Number.MAX_SAFE_INTEGER : profitFactor.toFixed(2)),
        holding_time: { meanHrs: Number(meanHrs.toFixed(2)), medianHrs: Number(medianHrs.toFixed(2)) },
        holding_time_hist: Object.entries(holdingHist).map(([bin, count]) => ({ bin, count })),
        outcome_hist: Object.entries(outcomeHist).map(([bucket, trades]) => ({ bucket, trades })),
      }
    })
  }

  if (subpath === 'costs') {
    // Sum fees grouped by asset_class, account_id, month (in timezone)
    let total = 0
    const byAsset: Record<string, number> = {}
    const byAccount: Record<string, number> = {}
    const byMonth: Record<string, number> = {}
    for (const t of (trades ?? [])) {
      const fee = Number((t as any).fees ?? 0)
      total += fee
      const ac = String((t.asset_class || t.asset_type || '')).toLowerCase()
      if (ac) byAsset[ac] = (byAsset[ac] || 0) + fee
      if (t.account_id) byAccount[t.account_id] = (byAccount[t.account_id] || 0) + fee
      // Month bucket
      const dt = utcToZonedTime((t.effective_date || t.exit_date || t.entry_date), tz)
      const m = format(dt, 'yyyy-MM')
      byMonth[m] = (byMonth[m] || 0) + fee
    }
    return NextResponse.json({
      ok: true,
      data: {
        total: Number(total.toFixed(2)),
        byAsset: Object.entries(byAsset).map(([asset_class, total]) => ({ asset_class, total: Number(total.toFixed(2)) })),
        byAccount: Object.entries(byAccount).map(([account_id, total]) => ({ account_id, total: Number(total.toFixed(2)) })),
        byMonth: Object.entries(byMonth).map(([month, total]) => ({ month, total: Number(total.toFixed(2)) })),
      }
    })
  }

  if (subpath === 'drawdown') {
    // Same as equity-curve: build daily equity, calc drawdown
    const { data: settings } = await supabase
      .from('user_settings')
      .select('initial_capital')
      .eq('user_id', user.id)
      .maybeSingle()
    const initial = Number(settings?.initial_capital ?? 10000)
    const daily: Record<string, number> = {}
    for (const t of (trades ?? [])) {
      const day = tzDay((t as any).effective_date ?? (t as any).exit_date ?? (t as any).entry_date, tz)
      daily[day] = (daily[day] ?? 0) + tradePnl(t)
    }
    const days = fillDays(start, end)
    let equity = initial
    let peak = initial
    let maxDD = 0
    let startIdx = 0, endIdx = 0, tmpStart = 0
    const series = [] as { date: string, equity: number }[]
    for (let i = 0; i < days.length; i++) {
      const d = days[i]
      const pnl = daily[d] ?? 0
      equity += pnl
      series.push({ date: d, equity })
      if (equity > peak) {
        peak = equity; tmpStart = i
      }
      const dd = equity - peak
      if (dd < maxDD) {
        maxDD = dd
        startIdx = tmpStart
        endIdx = i
      }
    }
    return NextResponse.json({
      ok: true,
      data: {
        max_dd_abs: Number(maxDD.toFixed(2)),
        max_dd_pct: peak === 0 ? 0 : Number((maxDD / peak).toFixed(4)),
        worst_start: days[startIdx] ?? null,
        worst_end: days[endIdx] ?? null
      }
    })
  }

  if (subpath === 'tags-breakdown') {
    // Supports trades.tags/strategies as string[] or null
    const tagMetrics: Record<string, { tag: string, trades: number, pnl: number, wins: number, losses: number, winTradePnl: number, lossTradePnl: number }> = {}
    const stratMetrics: Record<string, { tag: string, trades: number, pnl: number, wins: number, losses: number, winTradePnl: number, lossTradePnl: number }> = {}

    for (const t of (trades ?? [])) {
      // Tags: string[] or null (handle both JSON and string)
      const tags: string[] = Array.isArray(t.tags)
        ? t.tags.map((tg: string) => (tg || '').trim()).filter(Boolean)
        : typeof t.tags === 'string' && t.tags.trim() ? [t.tags.trim()] : []
      tags.forEach(tag => {
        if (!tag) return
        if (!tagMetrics[tag]) tagMetrics[tag] = { tag, trades: 0, pnl: 0, wins: 0, losses: 0, winTradePnl: 0, lossTradePnl: 0 }
        const pnl = tradePnl(t)
        tagMetrics[tag].trades++
        tagMetrics[tag].pnl += pnl
        if (pnl > 0) { tagMetrics[tag].wins++; tagMetrics[tag].winTradePnl += pnl }
        if (pnl < 0) { tagMetrics[tag].losses++; tagMetrics[tag].lossTradePnl += Math.abs(pnl) }
      })
      // Strategies: same logic (t.strategies)
      const strategies: string[] = Array.isArray((t as any).strategies)
        ? (t as any).strategies.map((tg: string) => (tg || '').trim()).filter(Boolean)
        : typeof (t as any).strategies === 'string' && (t as any).strategies.trim() ? [(t as any).strategies.trim()] : []
      strategies.forEach(tag => {
        if (!tag) return
        if (!stratMetrics[tag]) stratMetrics[tag] = { tag, trades: 0, pnl: 0, wins: 0, losses: 0, winTradePnl: 0, lossTradePnl: 0 }
        const pnl = tradePnl(t)
        stratMetrics[tag].trades++
        stratMetrics[tag].pnl += pnl
        if (pnl > 0) { stratMetrics[tag].wins++; stratMetrics[tag].winTradePnl += pnl }
        if (pnl < 0) { stratMetrics[tag].losses++; stratMetrics[tag].lossTradePnl += Math.abs(pnl) }
      })
    }
    // Build metrics arrays
    const tagsArr = Object.values(tagMetrics).map(s => ({
      tag: s.tag,
      trades: s.trades,
      pnl: Number(s.pnl.toFixed(2)),
      win_rate: s.wins + s.losses > 0 ? s.wins / (s.wins + s.losses) : 0,
      avg_win: s.wins ? Number((s.winTradePnl / s.wins).toFixed(2)) : 0,
      avg_loss: s.losses ? Number((s.lossTradePnl / s.losses).toFixed(2)) : 0,
    }))
    const stratsArr = Object.values(stratMetrics).map(s => ({
      tag: s.tag,
      trades: s.trades,
      pnl: Number(s.pnl.toFixed(2)),
      win_rate: s.wins + s.losses > 0 ? s.wins / (s.wins + s.losses) : 0,
      avg_win: s.wins ? Number((s.winTradePnl / s.wins).toFixed(2)) : 0,
      avg_loss: s.losses ? Number((s.lossTradePnl / s.losses).toFixed(2)) : 0,
    }))
    return NextResponse.json({
      ok: true,
      data: {
        tags: tagsArr,
        strategies: stratsArr
      }
    })
  }

  if (subpath === 'time-heatmap' || subpath === 'hourly-winrate') {
    // Habits by close weekday/hour; aggregate metrics
    const timezone = tz
    // { [weekday-hour]: { pnl, trades, wins } }
    const cellMap: Record<string, { weekday: number; hour: number; pnl: number; trades: number; wins: number }> = {}
    const hourMap: Record<number, { hour: number; pnl: number; trades: number; wins: number }> = {}
    for (const t of (trades ?? [])) {
      const dt = utcToZonedTime((t.effective_date || t.exit_date || t.entry_date), timezone)
      const weekday = dt.getDay(), hour = dt.getHours()
      const pnl = tradePnl(t)
      const isWin = pnl > 0
      // For heatmap (weekday, hour)
      const cellKey = `${weekday}-${hour}`
      if (!cellMap[cellKey]) cellMap[cellKey] = { weekday, hour, pnl: 0, trades: 0, wins: 0 }
      cellMap[cellKey].trades++
      cellMap[cellKey].pnl += pnl
      if (isWin) cellMap[cellKey].wins++
      // For hourly winrate (0-23)
      if (!hourMap[hour]) hourMap[hour] = { hour, pnl: 0, trades: 0, wins: 0 }
      hourMap[hour].trades++
      hourMap[hour].pnl += pnl
      if (isWin) hourMap[hour].wins++
    }
    if (subpath === 'time-heatmap') {
      return NextResponse.json({
        ok: true,
        data: {
          cells: Object.values(cellMap).map(c => ({
            weekday: c.weekday,
            hour: c.hour,
            pnl: Number(c.pnl.toFixed(2)),
            trades: c.trades,
            win_rate: c.trades ? c.wins / c.trades : 0,
          }))
        }
      })
    } else {
      // hourly-winrate
      return NextResponse.json({
        ok: true,
        data: Object.values(hourMap).map(c => ({
          hour: c.hour,
          pnl: Number(c.pnl.toFixed(2)),
          trades: c.trades,
          win_rate: c.trades ? c.wins / c.trades : 0
        }))
      })
    }
  }
  // keep existing behavior for other endpoints
  if (["tags-breakdown","time-heatmap","hourly-winrate","costs","drawdown","expectancy","profit-factor","holding-time","meta"].includes(subpath)) {
    if (subpath === 'meta') {
      return NextResponse.json({ ok: true, data: {
        accounts: [{ id: 'acc-1', name: 'Broker A' }, { id: 'acc-2', name: 'Broker B' }],
        symbols: ['AAPL','MSFT','SPY','QQQ'],
        tags: ['earnings','swing','news'],
        strategies: ['breakout','mean-reversion','trend-follow'],
        timezoneDefault: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      } })
    }
    return NextResponse.json({ ok: true, data: [] })
  }

  // fallback: proxy to backend function if needed (not used with stubs)
  return NextResponse.json({ ok: true, data: [] })
}
