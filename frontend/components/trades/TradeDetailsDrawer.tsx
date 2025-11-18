"use client";
import React, { useState, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import { fmtCurrency, compactDate, pnlChipColor } from "@/lib/ui/formatters";
import { TradeRow } from "@/types/trade";

const TABS = ["Overview", "Fills", "Notes", "Files"];

function calcRMultiple(trade: TradeRow): number | null {
  // R-multiple calculation not available with current TradeRow structure
  return null;
}

export function TradeRowDetailsDrawer({ trade, onClose }: { trade: TradeRow | null, onClose: () => void }) {
  const [tab, setTab] = useState("Overview");
  const [editingTags, setEditingTags] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (trade) {
      setTab("Overview");
      setTags(trade.tags || []);
      setNotes(trade.notes || "");
    }
  }, [trade]);

  // Sheet focus trap
  useEffect(() => {
    if (trade) {
      const el = document.getElementById('details-sheet');
      el?.focus();
    }
  }, [trade]);

  if (!trade) return null;
  const rMultiple = calcRMultiple(trade);
  // Derived Fills table - not available with current TradeRow structure
  const fills: any[] = [];
  const totalQty = trade.qty_opened || 0;
  const avgFill = trade.avg_open_price || 0;
  const realizedPnl = trade.realized_pnl || 0;


  // Tags: editable as chips
  const handleTagEdit = () => setEditingTags(true);
  const handleTagSave = async () => {
    if (!trade) return;
    setEditingTags(false);
    
    try {
      const response = await fetch(`/api/trades/${trade.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update tags');
      }
      
      toast.success("Tags updated");
    } catch (error) {
      console.error('Error saving tags:', error);
      toast.error("Failed to save tags");
      // Revert to original tags on error
      setTags(trade.tags || []);
    }
  };

  // Notes: autosave on blur
  const handleNotesBlur = async () => {
    if (!trade) return;
    
    // Only save if notes have changed
    if (notes === (trade.notes || "")) return;
    
    setSavingNotes(true);
    try {
      const response = await fetch(`/api/trades/${trade.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update notes');
      }
      
      toast.success("Notes saved");
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error("Failed to save notes");
      // Revert to original notes on error
      setNotes(trade.notes || "");
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <div
      id="details-sheet"
      tabIndex={-1}
      role="dialog"
      aria-label={`TradeRow details for ${trade.symbol}`}
      className="fixed top-0 right-0 w-full sm:w-[440px] h-full bg-popover z-50 shadow-lg border-l border-border flex flex-col outline-none"
      style={{ maxWidth: 500 }}
      onKeyDown={e => { if (e.key === 'Escape') onClose(); }}
    >
      <header className="flex items-center justify-between border-b p-4">
        <div>
          <div className="font-bold text-lg tracking-tight">{trade.symbol}</div>
          <div className="flex gap-2 items-center mt-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize bg-muted text-muted-foreground border`}>{trade.instrument_type}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize bg-muted text-muted-foreground border`}>{trade.status}</span>
            {typeof trade.realized_pnl === 'number' && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ml-2 ${pnlChipColor(trade.realized_pnl)}`}>{fmtCurrency(trade.realized_pnl)}</span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="ml-auto p-2 text-2xl focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Close details"
          tabIndex={0}
        >×</button>
      </header>
      {/* Tabs */}
      <div className="flex border-b bg-muted">
        {TABS.map(t => (
          <button
            key={t}
            className={`px-4 py-2 font-medium aria-[selected=true]:border-b-2 aria-[selected=true]:border-primary focus:outline-none focus:ring-2 focus:ring-ring ${tab === t ? 'border-b-2 border-primary bg-background' : ''}`}
            aria-selected={tab===t}
            tabIndex={0}
            onClick={() => setTab(t)}
          >{t}</button>
        ))}
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 bg-background">
        {tab === "Overview" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="font-medium">Opened:</span> {compactDate(trade.opened_at)}</div>
              <div><span className="font-medium">Closed:</span> {trade.closed_at ? compactDate(trade.closed_at) : '—'}</div>
              <div><span className="font-medium">Quantity:</span> {trade.qty_opened}</div>
              <div><span className="font-medium">Fees:</span> {fmtCurrency(trade.fees)}</div>
              <div><span className="font-medium">Strategy:</span> <span className="text-muted-foreground">—</span></div>
              <div><span className="font-medium">Duration:</span> <span className="text-muted-foreground">—</span></div>
              {typeof rMultiple === 'number' && (
                <div><span className="font-medium">R Multiple:</span> {rMultiple.toFixed(2)}</div>
              )}
            </div>
            <div>
              <span className="font-medium mr-2">Tags:</span>
              {!editingTags ? (
                <span>
                  {tags?.length > 0 ? tags.map(tag => (
                    <span key={tag} className="inline-block bg-muted px-1.5 py-0.5 rounded text-xs mr-1">
                      {tag}
                    </span>
                  )) : <span className="text-muted-foreground">—</span>}
                  <button onClick={handleTagEdit} className="ml-2 underline text-xs text-primary">Edit</button>
                </span>
              ) : (
                <span>
                  <input
                    value={tags.join(", ")}
                    onChange={e => setTags(e.target.value.split(",").map(t=>t.trim()).filter(Boolean))}
                    className="border rounded p-1 px-2 text-xs min-w-[120px]"
                    aria-label="Edit tags"
                    autoFocus
                    onBlur={handleTagSave}
                  />
                </span>
              )}
            </div>
          </div>
        )}
        {tab === "Fills" && (
          <div>
            {fills.length === 0 ? (
              <div className="p-4 text-muted-foreground text-sm">No fills found.</div>
            ) : (
              <table className="w-full text-sm border rounded">
                <thead>
                  <tr><th>Time</th><th>Side</th><th>Qty</th><th>Price</th></tr>
                </thead>
                <tbody>
                  {fills.map((f, i) => (
                    <tr key={i}>
                      <td>{f.time}</td>
                      <td>{f.side === "B" ? "Buy" : "Sell"}</td>
                      <td>{f.qty}</td>
                      <td>{fmtCurrency(f.price)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="font-bold" colSpan={2}>Totals</td>
                    <td className="font-bold">{totalQty}</td>
                    <td className="font-bold">{avgFill ? fmtCurrency(avgFill) : '—'}</td>
                  </tr>
                  <tr>
                    <td className="pt-2 font-bold" colSpan={4}>Realized P&L: <span className={`${pnlChipColor(realizedPnl)} px-2 rounded`}>{fmtCurrency(realizedPnl)}</span></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        )}
        {tab === "Notes" && (
          <div>
            <textarea
              className="border rounded w-full min-h-[120px] p-2 text-sm"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              aria-label="TradeRow Notes"
              disabled={savingNotes}
              onBlur={handleNotesBlur}
              placeholder="Add notes..."
            />
            <div className="text-xs text-muted-foreground pt-2">Autosaves on blur.</div>
          </div>
        )}
        {tab === "Files" && (
          <div>
            <span className="text-muted-foreground">No files attached.</span>
            <button className="px-3 py-1 bg-primary text-white rounded opacity-60 cursor-not-allowed" disabled aria-label="Attach file">Attach file</button>
          </div>
        )}
      </div>
    </div>
  );
}
