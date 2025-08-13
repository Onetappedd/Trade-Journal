import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type {
  EquityCurveRequest,
  MonthlyPnlRequest,
  CardsRequest,
  EquityCurveResponse,
  MonthlyPnlResponse,
  CardsSummary,
} from "@/lib/analytics-types"

const API_BASE_URL = (process.env.PYTHON_API_BASE_URL as string) || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

async function getAuthToken() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error("No Supabase session token found")
  return session.access_token
}

function mapAssetTypeToClasses(assetType?: string): ("stocks"|"options"|"futures")[]|undefined {
  if (!assetType || assetType === "all") return undefined
  // Accept singular or plural, normalize to backend contract plural
  const v = assetType.toLowerCase()
  if (v === "stock" || v === "stocks") return ["stocks"]
  if (v === "option" || v === "options") return ["options"]
  if (v === "future" || v === "futures") return ["futures"]
  return undefined
}

export async function fetchEquityCurve(req: Omit<EquityCurveRequest, "userTimezone"> & { userTimezone?: string }) {
  const token = await getAuthToken()
  const body: EquityCurveRequest = {
    ...req,
    userTimezone: req.userTimezone || "America/New_York",
  }
  const res = await fetch(`/api/analytics/equity-curve`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Equity curve API failed: ${res.status} ${res.statusText}`)
  return res.json() as Promise<EquityCurveResponse>
}

export async function fetchMonthlyPnl(req: Omit<MonthlyPnlRequest, "userTimezone"> & { userTimezone?: string }) {
  const token = await getAuthToken()
  const body: MonthlyPnlRequest = {
    ...req,
    userTimezone: req.userTimezone || "America/New_York",
  }
  const res = await fetch(`/api/analytics/monthly-pnl`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Monthly PnL API failed: ${res.status} ${res.statusText}`)
  return res.json() as Promise<MonthlyPnlResponse>
}

export async function fetchCardsSummary(req: Omit<CardsRequest, "userTimezone"> & { userTimezone?: string }) {
  const token = await getAuthToken()
  const body: CardsRequest = {
    ...req,
    userTimezone: req.userTimezone || "America/New_York",
  }
  const res = await fetch(`/api/analytics/cards`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Cards summary API failed: ${res.status} ${res.statusText}`)
  return res.json() as Promise<CardsSummary>
}

// Convenience composer for the Dashboard Analytics page
export async function getUnifiedAnalytics(params: {
  userId: string,
  accountIds?: string[],
  assetType?: string,
  strategy?: string,
  start?: string,
  end?: string,
}) {
  const assetClasses = mapAssetTypeToClasses(params.assetType)
  const strategies = params.strategy && params.strategy !== "all" ? [params.strategy] : undefined

  const [equity, monthly, cards] = await Promise.all([
    fetchEquityCurve({
      userId: params.userId,
      accountIds: params.accountIds,
      start: params.start,
      end: params.end,
      assetClasses,
      strategies,
      initialBalance: undefined,
      includeUnrealized: false,
    }),
    fetchMonthlyPnl({
      userId: params.userId,
      accountIds: params.accountIds,
      start: params.start,
      end: params.end,
      assetClasses,
      strategies,
    }),
    fetchCardsSummary({
      userId: params.userId,
      accountIds: params.accountIds,
      start: params.start,
      end: params.end,
      assetClasses,
      strategies,
    }),
  ])

  return { equity, monthly, cards }
}
