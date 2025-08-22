'use client'

import useSWRInfinite from 'swr/infinite'
import { useEffect } from 'react'
import { toast } from '@/components/ui/sonner'
import { DataTable } from '@/components/trades/DataTable'
import type { Trade } from '@/lib/server/trades'
// If your table expects a different prop, adjust accordingly (e.g., TradesTable, rows, etc)

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(async (res) => {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error || `Request failed: ${res.status}`)
  }
  return res.json()
})

export default function TradesPage() {
  const getKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.nextCursor) return null
    const cursor = pageIndex === 0 ? '' : `&cursor=${previousPageData.nextCursor}`
    // Add active filters from UI state if you have them (assetType, symbol, dates, etc.)
    return `/api/trades?limit=100${cursor}`
  }

  const { data, error, size, setSize, isLoading } = useSWRInfinite(getKey, fetcher)

  useEffect(() => {
    if (error) {
      console.error('[trades page] load error', error)
      toast.error('Failed to load trades')
    }
  }, [error])

  const items = data?.flatMap((p: any) => p.items) ?? []

  return (
    <div className="space-y-4">
      <DataTable
        data={items}
        isLoading={isLoading}
        onLoadMore={() => setSize(size + 1)}
        hasMore={Boolean(data?.[data.length - 1]?.nextCursor)}
      />
    </div>
  )
}
