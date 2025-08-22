"use client";
import React, { useState, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import { fmtCurrency, compactDate, pnlChipColor } from "@/lib/ui/formatters";
import { Trade } from "@/lib/trades";

const TABS = ["Overview", "Fills", "Notes", "Files"];

function calcRMultiple(trade: Trade): number | null {
  if (trade.rMultiple != null) return trade.rMultiple;
  // If avgEntry, avgExit, and stop are available, compute; else null
  if (typeof trade.avgEntry === 'number' && typeof trade.avgExit === 'number' && typeof trade.stop === 'number') {
    const risk = Math.abs(trade.avgEntry - trade.stop);
    if (risk > 0) {
      return (trade.avgExit - trade.avgEntry) / risk;
    }
  }
  return null;
}

export function TradeDetailsDrawer({ trade, onClose }: { trade: Trade | null, onClose: () => void }) {
  const [tab, setTab] = useState("Overview");
  const [editingTags, setEditingTags] = useState(false);
  const [tags, setTags] = useState<string[]>(trade?.tags || []);
  const [notes, setNotes] = useState(trade?.notes || "");
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
  // Derived Fills table
  const fills = (trade.fills || []).slice().sort((a, b) => a.time.localeCompare(b.time));
  const totalQty = fills.reduce((sum, f) => sum + Number(f.qty || 0), 0);
  const avgFill = fills.length > 0 ? fills.reduce((sum, f) => sum + (f.price * f.qty), 0) / totalQty : undefined;
  const realizedPnl = fills.length > 1 && typeof trade.avgEntry === 'number' && typeof trade.avgExit === 'number'
    ? (Number(trade.avgExit) - Number(trade.avgEntry)) * Number(trade.quantity || 0)
    : trade.pnl ?? null;

  // Tags: editable as chips
  const handleTagEdit = () => setEditingTags(true);
  const handleTagSave = () => {
    // TODO: Persist tags via API
    setEditingTags(false);
    toast.success("Tags updated");
  };

  // Notes: autosave on blur
  const handleNotesBlur = async () => {
    if (notes === trade.notes) return;
    setSavingNotes(true);
    try {
      // TODO: Persist note via API (replace with fetch in real impl)
      await new Promise(res => setTimeout(res, 600));
      toast.success("Notes saved");
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <div
      id="details-sheet"
      tabIndex={-1}
      role="dialog"
      aria-label={`Trade details for ${trade.symbol}`}
      className="fixed top-0 right-0 w-full sm:w-[440px] h-full bg-popover z-50 shadow-lg border-l border-border flex flex-col outline-none"
      style={{ maxWidth: 500 }}
      onKeyDown={e => { if (e.key === 'Escape') onClose(); }}
    >
      <header className="flex items-center justify-between border-b p-4">
        <div>
          <div className="font-bold text-lg tracking-tight">{trade.symbol}</div>
          <div className="flex gap-2 items-center mt-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize bg-muted text-muted-foreground border`}>{trade.assetType}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize bg-muted text-muted-foreground border`}>{trade.side}</span>
            {typeof trade.pnl === 'number' && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ml-2 ${pnlChipColor(trade.pnl)}`}>{fmtCurrency(trade.pnl)}</span>
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
              <div><span className="font-medium">Opened:</span> {compactDate(trade.date)}</div>
              <div><span className="font-medium">Closed:</span> {compactDate(trade.closeDate)}</div>
              <div><span className="font-medium">Quantity:</span> {trade.quantity}</div>
              <div><span className="font-medium">Fees:</span> {fmtCurrency(trade.fees)}</div>
              <div><span className="font-medium">Strategy:</span> {trade.strategy || <span className="text-muted-foreground">—</span>}</div>
              <div><span className="font-medium">Duration:</span> {trade.durationMin != null ? `${trade.durationMin} min` : '—'}</div>
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
              aria-label="Trade Notes"
              disabled={savingNotes}
              onBlur={handleNotesBlur}
              placeholder="Add notes..."
            />
            <div className="text-xs text-muted-foreground pt-2">Autosaves on blur.</div>
          </div>
        )}
        {tab === "Files" && (
          <div>
            <div className="mb-4">{trade.attachments?.length ? trade.attachments.map(file => (
              <div className="flex items-center gap-2 mb-1" key={file.id}>
                <span className="inline-block bg-muted px-2 py-0.5 rounded text-xs">{file.name}</span>
                <a href={file.url} target="_blank" rel="noopener noreferrer" className="underline text-xs">View</a>
              </div>
            )) : <span className="text-muted-foreground">No files attached.</span>}</div>
            <button className="px-3 py-1 bg-primary text-white rounded opacity-60 cursor-not-allowed" disabled aria-label="Attach file">Attach file</button>
          </div>
        )}
      </div>
    </div>
  );
}
