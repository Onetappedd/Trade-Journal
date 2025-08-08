"use client"

import * as React from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export type Trade = {
  id: string
  symbol: string
  side: string
  quantity: number
  entry_price: number
  entry_date: string
  exit_price?: number | null
  exit_date?: string | null
  asset_type: string
  broker: string
  status?: string
  underlying?: string
  expiry?: string
  option_type?: string
  strike_price?: string
}

function useUserTrades() {
  const { user } = useAuth()
  const fetcher = async () => {
    if (!user) return []
    const supabase = createClient()
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false })
    if (error) throw error
    return data as Trade[]
  }
  const { data, error, isLoading, mutate } = useSWR(user ? ["user-trades", user.id] : null, fetcher)
  return { trades: data || [], error, isLoading, mutate }
}

export function TradeTable() {
  const { trades, isLoading, mutate } = useUserTrades()
  const { toast } = useToast()
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editValue, setEditValue] = React.useState<Partial<Trade>>({})

  async function handleDelete(id: string) {
    if (!confirm("Delete this trade?")) return
    const supabase = createClient()
    const { error } = await supabase.from("trades").delete().eq("id", id)
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" })
    else {
      toast({ title: "Trade deleted" })
      mutate()
    }
  }

  function startEdit(trade: Trade) {
    setEditingId(trade.id)
    setEditValue({ ...trade })
  }

  async function saveEdit() {
    if (!editingId) return
    const supabase = createClient()
    const { error } = await supabase.from("trades").update(editValue).eq("id", editingId)
    if (error) toast({ title: "Edit failed", description: error.message, variant: "destructive" })
    else {
      toast({ title: "Trade updated" })
      setEditingId(null)
      mutate()
    }
  }

  if (isLoading) return <div>Loading trades...</div>
  if (!trades.length) return <div>No trades found.</div>

  return (
    <div className="overflow-x-auto border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead>Side</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Entry Price</TableHead>
            <TableHead>Entry Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade) => (
            <TableRow key={trade.id}>
              <TableCell>{trade.symbol}</TableCell>
              <TableCell><Badge>{trade.side.toUpperCase()}</Badge></TableCell>
              <TableCell>{editingId === trade.id ? (
                <input
                  type="number"
                  value={editValue.quantity ?? trade.quantity}
                  onChange={e => setEditValue(v => ({ ...v, quantity: Number(e.target.value) }))}
                  className="w-16 border rounded px-1"
                />
              ) : trade.quantity}</TableCell>
              <TableCell>{editingId === trade.id ? (
                <input
                  type="number"
                  value={editValue.entry_price ?? trade.entry_price}
                  onChange={e => setEditValue(v => ({ ...v, entry_price: Number(e.target.value) }))}
                  className="w-20 border rounded px-1"
                />
              ) : `$${trade.entry_price.toFixed(2)}`}</TableCell>
              <TableCell>{new Date(trade.entry_date).toLocaleDateString()}</TableCell>
              <TableCell>{trade.status || "-"}</TableCell>
              <TableCell>
                {editingId === trade.id ? (
                  <>
                    <Button size="sm" onClick={saveEdit}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <Button size="icon" variant="ghost" onClick={() => startEdit(trade)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(trade.id)}><Trash2 className="h-4 w-4" /></Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
