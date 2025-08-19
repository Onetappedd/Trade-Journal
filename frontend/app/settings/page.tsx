"use client"
import React, { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchJson } from "@/lib/analytics/client"
import { useFiltersStore } from "@/lib/analytics/filtersStore"
import { useTheme } from "next-themes"

const SETTINGS_QUERY_KEY = ["user-settings"]

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const { setTheme, theme: activeTheme, resolvedTheme } = useTheme()
  const [localTheme, setLocalTheme] = useState<string>("system")
  const { datePreset, accountIds, assetClasses, tags, strategies, symbols, timezone } = useFiltersStore();
  const filtersHash = [
    datePreset,
    accountIds.join(','),
    assetClasses.join(','),
    tags.join(','),
    strategies.join(','),
    symbols.join(','),
    timezone,
  ].join('|');

  const { data, isLoading } = useQuery<{ initial_capital?: number; theme?: string }>({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: async () => fetchJson("user-settings", {}),
    staleTime: 120_000
  })
  const [initialCapital, setInitialCapital] = useState<number>(10000)

  useEffect(() => {
    if (data) {
      setInitialCapital(Number(data.initial_capital || 10000))
      setLocalTheme(data.theme || "system")
      setTheme(data.theme || "system")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  // On theme dropdown change, apply immediately
  useEffect(() => { setTheme(localTheme) }, [localTheme, setTheme])

  const saveMutation = useMutation({
    mutationFn: async (values: { initial_capital: number; theme: string }) =>
      fetchJson("user-settings", values),
    onMutate: async (values) => {
      setTheme(values.theme)
      setInitialCapital(values.initial_capital)
      queryClient.setQueryData(SETTINGS_QUERY_KEY, values)
    },
    onSuccess: () => {
      // Invalidate analytics (performance) cache for filters
      queryClient.invalidateQueries({ queryKey: ["analytics", filtersHash, "cards"] })
      queryClient.invalidateQueries({ queryKey: ["analytics", filtersHash, "equity-curve"] })
    },
  })

  if (isLoading) return <div className="p-4">Loading settings…</div>

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">User Settings</h1>

      <form className="space-y-6"
        onSubmit={e => {
          e.preventDefault()
          saveMutation.mutate({ initial_capital: initialCapital, theme: localTheme })
        }}>
        <div>
          <label htmlFor="init-cap" className="block text-sm font-medium mb-1">Initial Capital</label>
          <input
            id="init-cap"
            type="number"
            min={0}
            step={100}
            value={initialCapital}
            onChange={e => setInitialCapital(Math.max(0, Number(e.target.value)))}
            className="block w-full rounded border bg-background text-foreground px-2 py-1"
          />
        </div>
        <div>
          <label htmlFor="theme" className="block text-sm font-medium mb-1">Theme</label>
          <select
            id="theme"
            value={localTheme}
            onChange={e => setLocalTheme(e.target.value)}
            className="block rounded border bg-background text-foreground px-2 py-1"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <button type="submit" disabled={saveMutation.isPending} className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md">
          {saveMutation.isPending ? "Saving…" : "Save"}
        </button>
        {saveMutation.isSuccess && (
          <div className="text-green-600 text-sm">Saved!</div>
        )}
        {saveMutation.isError && (
          <div className="text-destructive text-sm">Error: {(saveMutation.error as any)?.message || 'Failed to save settings'}</div>
        )}
      </form>
      <div className="mt-8 text-muted-foreground text-xs">
        Theme is instantly applied and synced across devices.<br />
        Changing initial capital will update all your analytics calculations.
      </div>
    </div>
  )
}
