import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useSupabaseTrades(userId: string | undefined) {
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch trades for the current user
  const fetchTrades = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .order('trade_date', { ascending: false });
    if (error) setError(error.message);
    setTrades(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  // Add a trade
  const addTrade = useCallback(async (trade: any) => {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from('trades')
      .insert([{ ...trade, user_id: userId }]);
    setLoading(false);
    if (error) setError(error.message);
    else fetchTrades();
    return !error;
  }, [userId, fetchTrades]);

  // Update a trade
  const updateTrade = useCallback(async (tradeId: string, updatedFields: any) => {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from('trades')
      .update(updatedFields)
      .eq('id', tradeId)
      .eq('user_id', userId);
    setLoading(false);
    if (error) setError(error.message);
    else fetchTrades();
    return !error;
  }, [userId, fetchTrades]);

  // Delete a trade
  const deleteTrade = useCallback(async (tradeId: string) => {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', tradeId)
      .eq('user_id', userId);
    setLoading(false);
    if (error) setError(error.message);
    else fetchTrades();
    return !error;
  }, [userId, fetchTrades]);

  return { trades, loading, error, fetchTrades, addTrade, updateTrade, deleteTrade };
}
