import { createServerClient } from "@supabase/ssr"

// Parse the root symbol from a futures code (e.g., MNQH4 → MNQ)
export function parseFuturesRoot(symbol: string) {
  return (symbol.match(/^[A-Za-z]+/)?.[0] || symbol).toUpperCase()
}

let instrumentCache: Record<string, { meta: { point_value?: number; option_multiplier?: number; tick_size?: number }, expires: number }> = {}

export function invalidateInstrumentsCache() {
  instrumentCache = {}
}

export async function getInstrumentMeta(root: string, asset_class: string): Promise<{ point_value: number; option_multiplier: number; tick_size?: number }> {
  const cacheKey = `${root}:${asset_class}`
  const now = Date.now()
  if (instrumentCache[cacheKey] && instrumentCache[cacheKey].expires > now) {
    return {
      point_value: instrumentCache[cacheKey].meta.point_value ?? 1,
      option_multiplier: instrumentCache[cacheKey].meta.option_multiplier ?? 100,
      tick_size: instrumentCache[cacheKey].meta.tick_size
    }
  }
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: inst } = await supabase.from('instruments').select('point_value,option_multiplier,tick_size').eq('symbol_root', root).eq('asset_class', asset_class).maybeSingle()
  const meta = {
    point_value: inst?.point_value ?? 1,
    option_multiplier: inst?.option_multiplier ?? 100,
    tick_size: inst?.tick_size
  }
  instrumentCache[cacheKey] = { meta, expires: now + 600_000 }
  return meta
}

export async function prefetchInstrumentsMeta(roots: Array<{root: string, asset_class: string}>) {
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const filters = roots.map(({root, asset_class}) => `("${root}","${asset_class}")`).join(",")
  // Query all needed combinations in one call
  const { data, error } = await supabase
    .from('instruments')
    .select('symbol_root,asset_class,point_value,option_multiplier,tick_size')
    .or(roots.map(r=>`symbol_root.eq.${r.root},asset_class.eq.${r.asset_class}`).join(','))

  const now = Date.now()
  if (data) {
    for (const row of data) {
      const cacheKey = `${row.symbol_root}:${row.asset_class}`
      instrumentCache[cacheKey] = {
        meta: {
          point_value: row.point_value ?? 1,
          option_multiplier: row.option_multiplier ?? 100,
          tick_size: row.tick_size
        },
        expires: now + 600_000
      }
    }
  }
  return data
}
