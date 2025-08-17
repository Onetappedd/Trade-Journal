import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getDailyCloses } from "@/lib/marketdata/provider"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BenchmarkInputSchema = z.object({
  ticker: z.string().optional().default('SPY'),
  start: z.string().optional(),
  end: z.string().optional(),
  tz: z.string().optional(),
})
const BenchmarkOutputSchema = z.object({
  ticker: z.string(),
  series: z.array(z.object({ day: z.string(), close: z.number() }))
})

export async function POST(req: NextRequest) {
  const raw = await req.json().catch(() => ({}))
  const parsed = BenchmarkInputSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }
  const { ticker, start, end } = parsed.data
  let result = []
  try {
    result = await getDailyCloses((ticker ?? 'SPY') as string, start, end)
    result.sort((a, b) => a.day.localeCompare(b.day))
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Fetch error' }, { status: 500 })
  }
  const out = { ticker: ticker || 'SPY', series: result }
  const parsedOut = BenchmarkOutputSchema.safeParse(out)
  if (!parsedOut.success) {
    return NextResponse.json({ error: 'Invalid output', details: parsedOut.error.flatten() }, { status: 500 })
  }
  return NextResponse.json(parsedOut.data)
}
