'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

export interface ScannerFilters {
  universe?: string[]
  priceMin?: number
  priceMax?: number
  volumeMin?: number
  rvolMin?: number
  changeMin?: number
  changeMax?: number
  marketCap?: string[]
  atrMin?: number
  atrPercentMin?: number
  hv20Min?: number
  rsiMin?: number
  rsiMax?: number
  week52Proximity?: number
  maCross?: string[]
  vwapDistance?: number
  ivRankMin?: number
  ivPercentileMin?: number
  oiMin?: number
  oiVolRatio?: number
  deltaBucket?: string[]
  daysToExpiryMin?: number
  daysToExpiryMax?: number
  contractRoot?: string[]
  sessionFilter?: string
  sectors?: string[]
  watchlistOnly?: boolean
}

export interface SortConfig {
  id: string
  desc: boolean
}

export interface ScannerState {
  filters: ScannerFilters
  preset: string | null
  sortConfig: SortConfig[]
  visibleColumns: string[]
}

export function useScannerState() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [filters, setFiltersState] = useState<ScannerFilters>({})
  const [preset, setPresetState] = useState<string | null>(null)
  const [sortConfig, setSortConfigState] = useState<SortConfig[]>([])
  const [visibleColumns, setVisibleColumnsState] = useState<string[]>([
    'symbol', 'name', 'price', 'change', 'volume'
  ])

  // Initialize state from URL params
  useEffect(() => {
    const urlFilters: ScannerFilters = {}
    
    // Parse filters from URL
    if (searchParams.get('universe')) {
      urlFilters.universe = searchParams.get('universe')?.split(',') || []
    }
    if (searchParams.get('priceMin')) {
      urlFilters.priceMin = parseFloat(searchParams.get('priceMin') || '0')
    }
    if (searchParams.get('priceMax')) {
      urlFilters.priceMax = parseFloat(searchParams.get('priceMax') || '0')
    }
    if (searchParams.get('volumeMin')) {
      urlFilters.volumeMin = parseFloat(searchParams.get('volumeMin') || '0')
    }
    if (searchParams.get('rvolMin')) {
      urlFilters.rvolMin = parseFloat(searchParams.get('rvolMin') || '0')
    }
    if (searchParams.get('changeMin')) {
      urlFilters.changeMin = parseFloat(searchParams.get('changeMin') || '0')
    }
    if (searchParams.get('changeMax')) {
      urlFilters.changeMax = parseFloat(searchParams.get('changeMax') || '0')
    }
    if (searchParams.get('marketCap')) {
      urlFilters.marketCap = searchParams.get('marketCap')?.split(',') || []
    }
    if (searchParams.get('atrMin')) {
      urlFilters.atrMin = parseFloat(searchParams.get('atrMin') || '0')
    }
    if (searchParams.get('atrPercentMin')) {
      urlFilters.atrPercentMin = parseFloat(searchParams.get('atrPercentMin') || '0')
    }
    if (searchParams.get('hv20Min')) {
      urlFilters.hv20Min = parseFloat(searchParams.get('hv20Min') || '0')
    }
    if (searchParams.get('rsiMin')) {
      urlFilters.rsiMin = parseFloat(searchParams.get('rsiMin') || '0')
    }
    if (searchParams.get('rsiMax')) {
      urlFilters.rsiMax = parseFloat(searchParams.get('rsiMax') || '0')
    }
    if (searchParams.get('week52Proximity')) {
      urlFilters.week52Proximity = parseFloat(searchParams.get('week52Proximity') || '0')
    }
    if (searchParams.get('maCross')) {
      urlFilters.maCross = searchParams.get('maCross')?.split(',') || []
    }
    if (searchParams.get('vwapDistance')) {
      urlFilters.vwapDistance = parseFloat(searchParams.get('vwapDistance') || '0')
    }
    if (searchParams.get('ivRankMin')) {
      urlFilters.ivRankMin = parseFloat(searchParams.get('ivRankMin') || '0')
    }
    if (searchParams.get('ivPercentileMin')) {
      urlFilters.ivPercentileMin = parseFloat(searchParams.get('ivPercentileMin') || '0')
    }
    if (searchParams.get('oiMin')) {
      urlFilters.oiMin = parseFloat(searchParams.get('oiMin') || '0')
    }
    if (searchParams.get('oiVolRatio')) {
      urlFilters.oiVolRatio = parseFloat(searchParams.get('oiVolRatio') || '0')
    }
    if (searchParams.get('deltaBucket')) {
      urlFilters.deltaBucket = searchParams.get('deltaBucket')?.split(',') || []
    }
    if (searchParams.get('daysToExpiryMin')) {
      urlFilters.daysToExpiryMin = parseFloat(searchParams.get('daysToExpiryMin') || '0')
    }
    if (searchParams.get('daysToExpiryMax')) {
      urlFilters.daysToExpiryMax = parseFloat(searchParams.get('daysToExpiryMax') || '0')
    }
    if (searchParams.get('contractRoot')) {
      urlFilters.contractRoot = searchParams.get('contractRoot')?.split(',') || []
    }
    if (searchParams.get('sessionFilter')) {
      urlFilters.sessionFilter = searchParams.get('sessionFilter') || ''
    }
    if (searchParams.get('sectors')) {
      urlFilters.sectors = searchParams.get('sectors')?.split(',') || []
    }
    if (searchParams.get('watchlistOnly')) {
      urlFilters.watchlistOnly = searchParams.get('watchlistOnly') === 'true'
    }

    setFiltersState(urlFilters)
    
    // Parse other state
    const urlPreset = searchParams.get('preset')
    if (urlPreset) {
      setPresetState(urlPreset)
    }

    const urlSort = searchParams.get('sort')
    if (urlSort) {
      try {
        setSortConfigState(JSON.parse(urlSort))
      } catch {
        setSortConfigState([])
      }
    }

    const urlColumns = searchParams.get('columns')
    if (urlColumns) {
      setVisibleColumnsState(urlColumns.split(','))
    }
  }, [searchParams])

  // Update URL when state changes
  const updateURL = useCallback((newState: Partial<ScannerState>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Update filters
    if (newState.filters !== undefined) {
      Object.entries(newState.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            if (value.length > 0) {
              params.set(key, value.join(','))
            } else {
              params.delete(key)
            }
          } else if (typeof value === 'boolean') {
            params.set(key, value.toString())
          } else {
            params.set(key, value.toString())
          }
        } else {
          params.delete(key)
        }
      })
    }

    // Update preset
    if (newState.preset !== undefined) {
      if (newState.preset) {
        params.set('preset', newState.preset)
      } else {
        params.delete('preset')
      }
    }

    // Update sort
    if (newState.sortConfig !== undefined) {
      if (newState.sortConfig.length > 0) {
        params.set('sort', JSON.stringify(newState.sortConfig))
      } else {
        params.delete('sort')
      }
    }

    // Update columns
    if (newState.visibleColumns !== undefined) {
      params.set('columns', newState.visibleColumns.join(','))
    }

    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  // State setters that update URL
  const setFilters = useCallback((newFilters: ScannerFilters) => {
    setFiltersState(newFilters)
    updateURL({ filters: newFilters })
  }, [updateURL])

  const setPreset = useCallback((newPreset: string | null) => {
    setPresetState(newPreset)
    updateURL({ preset: newPreset })
  }, [updateURL])

  const setSortConfig = useCallback((newSortConfig: SortConfig[]) => {
    setSortConfigState(newSortConfig)
    updateURL({ sortConfig: newSortConfig })
  }, [updateURL])

  const setVisibleColumns = useCallback((newColumns: string[]) => {
    setVisibleColumnsState(newColumns)
    updateURL({ visibleColumns: newColumns })
  }, [updateURL])

  return {
    filters,
    setFilters,
    preset,
    setPreset,
    sortConfig,
    setSortConfig,
    visibleColumns,
    setVisibleColumns
  }
}
