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

  // Coerce inputs to strings with sensible defaults
  const today = new Date();
  const defaultEnd: string = today.toISOString().slice(0, 10);
  const defaultStart: string = new Date(today.getTime() - 1000 * 60 * 60 * 24 * 180)
    .toISOString()
    .slice(0, 10);

  const safeTicker: string = (ticker ?? 'SPY').toString().toUpperCase();
  const safeStart: string = (start ?? defaultStart).toString();
  const safeEnd: string = (end ?? defaultEnd).toString();

  let result = [];
  try {
    result = await getDailyCloses(safeTicker, safeStart, safeEnd);
    result.sort((a, b) => a.day.localeCompare(b.day));
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
