"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useAnalyticsFiltersStore } from "@/lib/analytics/filtersStore"
import { useQuery } from "@tanstack/react-query"
import { fetchJson } from "@/lib/analytics/client"

export function FiltersBar() {
  const store = useAnalyticsFiltersStore()
  // Ensure default timezone comes from browser (store already defaults to browser, this keeps UI in sync)
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (tz && tz !== store.timezone) store.setTimezone(tz)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const { data } = useQuery({
    queryKey: ['analytics','meta'],
    queryFn: async () => fetchJson('meta', {}),
    staleTime: 60_000,
  }) as any

  // Local controlled inputs for custom date
  const [customStart, setCustomStart] = useState<string>(store.dateRange?.start || "")
  const [customEnd, setCustomEnd] = useState<string>(store.dateRange?.end || "")

  useEffect(() => {
    if (store.datePreset !== 'CUSTOM') return
    store.setDateRange({ start: customStart, end: customEnd })
  }, [customStart, customEnd, store])

  const presets: Array<{ key: typeof store.datePreset; label: string }> = [
    { key: '1W', label: '1W' },
    { key: '1M', label: '1M' },
    { key: '3M', label: '3M' },
    { key: 'YTD', label: 'YTD' },
    { key: '1Y', label: '1Y' },
    { key: 'ALL', label: 'All' },
    { key: 'CUSTOM', label: 'Custom' },
  ]

  return (
    <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-md p-3">
      <div className="flex flex-wrap gap-3 items-center">
        {/* Date presets */}
        <div className="flex items-center gap-1" aria-label="Date presets">
          {presets.map(p => (
            <button
              key={p.key}
              className={`text-sm px-2 py-1 rounded-md border ${store.datePreset === p.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}
              onClick={() => store.setDatePreset(p.key)}
            >{p.label}</button>
          ))}
        </div>

        {/* Custom date range */}
        {store.datePreset === 'CUSTOM' && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">From</label>
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="text-sm border rounded px-2 py-1 bg-background" />
            <label className="text-sm text-muted-foreground">To</label>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="text-sm border rounded px-2 py-1 bg-background" />
          </div>
        )}

        {/* Accounts multi-select (placeholder UI) */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Accounts</label>
          <select multiple className="text-sm border rounded px-2 py-1 bg-background" onChange={(e) => {
            const options = Array.from(e.target.selectedOptions).map(o => o.value)
            store.setAccountIds(options)
          }}>
            {data?.data?.accounts?.map((a: any) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        {/* Asset class chips */}
        <div className="flex items-center gap-1" aria-label="Assets">
          {(['stocks','options','futures','crypto'] as const).map(asset => {
            const active = store.assetClasses.includes(asset)
            return (
              <button key={asset} className={`text-sm px-2 py-1 rounded-md border ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`} onClick={() => {
                if (active) store.setAssetClasses(store.assetClasses.filter(a => a !== asset))
                else store.setAssetClasses([...store.assetClasses, asset])
              }}>{asset[0].toUpperCase()+asset.slice(1)}</button>
            )
          })}
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Tags</label>
          <input type="text" placeholder="comma,separated" className="text-sm border rounded px-2 py-1 bg-background" onBlur={e => {
            const vals = e.target.value.split(',').map(v => v.trim()).filter(Boolean)
            store.setTags(vals)
          }} />
          <div className="text-xs text-muted-foreground">Suggestions: {data?.data?.tags?.join(', ')}</div>
        </div>

        {/* Strategies */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Strategies</label>
          <input type="text" placeholder="comma,separated" className="text-sm border rounded px-2 py-1 bg-background" onBlur={e => {
            const vals = e.target.value.split(',').map(v => v.trim()).filter(Boolean)
            store.setStrategies(vals)
          }} />
          <div className="text-xs text-muted-foreground">Suggestions: {data?.data?.strategies?.join(', ')}</div>
        </div>

        {/* Symbol autocomplete (basic free text for now) */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Symbols</label>
          <input list="symbols-list" type="text" placeholder="AAPL, MSFT" className="text-sm border rounded px-2 py-1 bg-background" onBlur={e => {
            const vals = e.target.value.split(',').map(v => v.trim().toUpperCase()).filter(Boolean)
            store.setSymbols(vals)
          }} />
          <datalist id="symbols-list">
            {data?.data?.symbols?.map((s: string) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        {/* Timezone selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Timezone</label>
          <select className="text-sm border rounded px-2 py-1 bg-background" value={store.timezone} onChange={e => store.setTimezone(e.target.value)}>
            {data?.data?.timezoneDefault && !store.timezone && (
              <option value={data.data.timezoneDefault}>{data.data.timezoneDefault}</option>
            )}
            {Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone').map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            )) : (
              <option value={store.timezone}>{store.timezone}</option>
            )}
          </select>
        </div>

        {/* Reset */}
        <div className="flex-1"></div>
        <button className="text-sm px-3 py-1 rounded-md border bg-muted" onClick={() => store.reset()}>Reset filters</button>
      </div>
    </div>
  )
}
