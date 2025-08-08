import { createClient } from '@/lib/supabase'

export interface ExpiredOptionUpdate {
  tradesUpdated: number
  errors: number
  expiredTrades: any[]
}

/**
 * Updates open option trades that have passed their expiration date
 * Marks them as 'expired' and sets them as editable for user resolution
 */
export async function updateExpiredOptionsTrades(userId: string): Promise<ExpiredOptionUpdate> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  
  try {
    // Fetch all open option trades for the user
    const { data: openOptions, error: fetchError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .eq('asset_type', 'option')
      .eq('status', 'open')
    
    if (fetchError) {
      console.error('Error fetching open options:', fetchError)
      throw new Error(fetchError.message)
    }
    
    if (!openOptions || openOptions.length === 0) {
      return {
        tradesUpdated: 0,
        errors: 0,
        expiredTrades: []
      }
    }
    
    // Filter for expired options (expiration_date < today)
    const expiredOptions = openOptions.filter(trade => {
      if (!trade.expiration_date) return false
      
      // Compare dates (both in YYYY-MM-DD format)
      return trade.expiration_date < today
    })
    
    if (expiredOptions.length === 0) {
      return {
        tradesUpdated: 0,
        errors: 0,
        expiredTrades: []
      }
    }
    
    // Update each expired option
    let successCount = 0
    let errorCount = 0
    const updatedTrades: any[] = []
    
    for (const trade of expiredOptions) {
      const { error: updateError } = await supabase
        .from('trades')
        .update({
          status: 'expired',
          editable: true,
          // Add a note about automatic expiration
          notes: trade.notes 
            ? `${trade.notes}\n[Auto-marked as expired on ${today}]`
            : `[Auto-marked as expired on ${today}]`
        })
        .eq('id', trade.id)
        .eq('user_id', userId) // Extra safety check
      
      if (updateError) {
        console.error(`Failed to update trade ${trade.id}:`, updateError)
        errorCount++
      } else {
        successCount++
        updatedTrades.push({
          ...trade,
          status: 'expired',
          editable: true
        })
      }
    }
    
    return {
      tradesUpdated: successCount,
      errors: errorCount,
      expiredTrades: updatedTrades
    }
  } catch (error) {
    console.error('Error in updateExpiredOptionsTrades:', error)
    throw error
  }
}

/**
 * Check if user has any expired options that need attention
 */
export async function checkForExpiredOptions(userId: string): Promise<number> {
  const supabase = createClient()
  
  try {
    const { count, error } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('asset_type', 'option')
      .eq('status', 'expired')
      .eq('editable', true)
    
    if (error) {
      console.error('Error checking expired options:', error)
      return 0
    }
    
    return count || 0
  } catch (error) {
    console.error('Error in checkForExpiredOptions:', error)
    return 0
  }
}