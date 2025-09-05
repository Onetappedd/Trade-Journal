'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { createClient } from '@/lib/supabase'
import { ScannerState } from './useScannerState'

export interface SavedScan {
  id: string
  name: string
  slug: string
  params: ScannerState
  created_at: string
}

export function useSavedScans() {
  const { user } = useAuth()
  const [savedScans, setSavedScans] = useState<SavedScan[]>([])
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  // Load saved scans
  useEffect(() => {
    if (user) {
      loadSavedScans()
    }
  }, [user])

  const loadSavedScans = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('saved_scans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading saved scans:', error)
        return
      }

      setSavedScans(data || [])
    } catch (error) {
      console.error('Error loading saved scans:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveScan = async (name: string, params: ScannerState): Promise<boolean> => {
    if (!user) return false

    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      
      const { error } = await (supabase as any)
        .from('saved_scans')
        .insert({
          user_id: user.id,
          name,
          slug,
          params
        })

      if (error) {
        console.error('Error saving scan:', error)
        return false
      }

      await loadSavedScans()
      return true
    } catch (error) {
      console.error('Error saving scan:', error)
      return false
    }
  }

  const loadScan = async (scanId: string): Promise<ScannerState | null> => {
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from('saved_scans')
        .select('params')
        .eq('id', scanId)
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error loading scan:', error)
        return null
      }

      return (data as any)?.params || null
    } catch (error) {
      console.error('Error loading scan:', error)
      return null
    }
  }

  const deleteScan = async (scanId: string): Promise<boolean> => {
    if (!user) return false

    try {
      const { error } = await (supabase as any)
        .from('saved_scans')
        .delete()
        .eq('id', scanId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error deleting scan:', error)
        return false
      }

      await loadSavedScans()
      return true
    } catch (error) {
      console.error('Error deleting scan:', error)
      return false
    }
  }

  return {
    savedScans,
    loading,
    saveScan,
    loadScan,
    deleteScan,
    refresh: loadSavedScans
  }
}
