import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createSupabaseServer } from "@/lib/supabase-server"
import { getDailyCloses } from "@/lib/marketdata/provider"
import { addDays, format } from "date-fns"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

const RiskInputSchema = z.object({
  ticker: z.string().optional().default('SPY'),
  tz: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional()
})
const RiskOutputSchema = z.object({
  alpha_daily: z.number(),
  alpha_annual: z.number(),
  beta: z.number(),
  up_capture: z.number(),
  down_capture: z.number(),
  information_ratio: z.number(),
  cagr: z.number(),
  mar: z.number(),
  ulcer_index: z.number(),
  sample_size: z.number(),
  ticker: z.string(),
  note: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServer()
  // For authenticated endpoint, you could fetch user's trades view, filters, etc here
  const raw = await req.json().catch(() => ({}))
  const parsed = RiskInputSchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  const { ticker, tz, start, end } = parsed.data
  const tiny = 1e-10

  // 1. Portfolio daily series
  let userId = null
  const { data: { user } } = await supabase.auth.getUser()
  if (user) userId = user.id
  else return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Optionally: read and apply analytics filters if passed (not shown here)

  // Fetch equity series (from function for user's portfolio)
  const today = format(new Date(), 'yyyy-MM-dd')
  const defaultStart = format(addDays(new Date(), -90), 'yyyy-MM-dd')
  const s = start ?? defaultStart
  const e = end ?? today
  const { data: settings } = await supabase
    .from('user_settings').select('initial_capital').eq('user_id', userId).maybeSingle()
  const initial = Number(settings?.initial_capital ?? 10000)
  const { data: pnlRows, error } = await supabase.rpc('analytics_daily_pnl', { p_user: userId, p_start: s, p_end: e, p_tz: tz })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Build cumulative equity
  let equity = initial
  const equitySeries: { day: string, equity: number }[] = []
  for(const row of pnlRows ?? []) {
    equity += Number(row.pnl ?? 0)
    equitySeries.push({ day: row.day, equity: Number(equity.toFixed(2)) })
  }

  // 2. Fetch benchmark closes
  let bm: { day: string; close: number }[] = []
  try { bm = await getDailyCloses(ticker, s, e) } catch { bm = [] }

  // 3. Align on intersection
  const eMap = new Map(equitySeries.map(e => [e.day, e.equity]))
  const bMap = new Map(bm.map(b => [b.day, b.close]))
  const days = [...eMap.keys()].filter(d => bMap.has(d)).sort()
  if (days.length < 15) {
    return NextResponse.json({ ...RiskOutputSchema.parse({ alpha_daily: 0, alpha_annual: 0, beta: 0, up_capture: 0, down_capture: 0, information_ratio: 0, cagr: 0, mar: 0, ulcer_index: 0, sample_size: days.length, ticker: ticker || 'SPY', note: 'Insufficient data for risk analytics' }) })
  }

  // 4. Returns
  const P: number[] = []
  const B: number[] = []
  let lastP = eMap.get(days[0]) || initial
  let lastB = bMap.get(days[0]) || 0
  for (let i = 1; i < days.length; i++) {
    const d = days[i]
    const thisP = eMap.get(d) || lastP
    const thisB = bMap.get(d) || lastB
    P.push((thisP - lastP) / Math.max(lastP, tiny))
    B.push((thisB - lastB) / Math.max(lastB, tiny))
    lastP = thisP; lastB = thisB
  }
  // 5. Metrics
  const mean = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
  const std = (arr: number[], avg = mean(arr)) => Math.sqrt(arr.length ? arr.reduce((sum, x) => sum + (x - avg) ** 2, 0) / arr.length : 0)
  const varB = std(B) ** 2
  const cov = mean(P.map((r, i) => (r - mean(P)) * (B[i] - mean(B))))
  const beta = varB < tiny ? 0 : cov / varB
  const alpha_daily = mean(P) - beta * mean(B)
  const alpha_annual = alpha_daily * 252
  // Tracking error and information ratio
  const trackErr = std(P.map((r, i) => r - B[i]))
  const information_ratio = trackErr === 0 ? 0 : (mean(P.map((r,i)=>r-B[i])) / trackErr) * Math.sqrt(252)
  // Up/Down capture
  const upCapture = mean(P.filter((_,i)=>B[i]>0)) / Math.max(mean(B.filter(b=>b>0)), tiny)
  const downCapture = mean(P.filter((_,i)=>B[i]<0)) / Math.max(Math.abs(mean(B.filter(b=>b<0))), tiny)
  // CAGR, MAR, MaxDD, UIndex
  const eq0 = eMap.get(days[0]) || initial
  const eqLast = eMap.get(days[days.length-1]) || initial
  const n = days.length
  const cagr = n > 1 ? Math.pow(eqLast/eq0, 252/n) - 1 : 0
  let peak = eq0, maxDD = 0, minIdx = 0, maxIdx = 0;
  const dd: number[] = []
  let localStart = 0
  let equityNow = eq0
  for(let i=0;i<days.length;i++) {
    equityNow = eMap.get(days[i]) || equityNow
    if (equityNow > peak) { peak = equityNow; localStart = i }
    const dval = equityNow / Math.max(peak, tiny) - 1
    dd.push(dval)
    if (dval < maxDD) { maxDD = dval; minIdx = i; maxIdx = localStart }
  }
  const mar = maxDD === 0 ? 0 : cagr / Math.abs(maxDD)
  const ulcer_index = Math.sqrt(dd.reduce((s, v) => s + Math.pow(Math.min(0, v),2), 0) / dd.length)

  const out = {
    alpha_daily: Number(alpha_daily.toFixed(4)),
    alpha_annual: Number(alpha_annual.toFixed(4)),
    beta: Number(beta.toFixed(4)),
    up_capture: Number(upCapture.toFixed(4)),
    down_capture: Number(downCapture.toFixed(4)),
    information_ratio: Number(information_ratio.toFixed(4)),
    cagr: Number(cagr.toFixed(4)),
    mar: Number(mar.toFixed(4)),
    ulcer_index: Number(ulcer_index.toFixed(4)),
    sample_size: days.length,
    ticker: ticker || 'SPY',
  }
  return NextResponse.json(RiskOutputSchema.parse(out))
}
