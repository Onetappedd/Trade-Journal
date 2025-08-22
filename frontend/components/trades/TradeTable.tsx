"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Trade } from "@/lib/trades";
import { exportTradesCsv } from "@/lib/trades";
import { toast } from "@/components/ui/sonner";
import { fmtCurrency, pnlChipColor, compactDate } from "@/lib/ui/formatters";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
}

// Mock API for delete and bulk tag; replace with fetch to real endpoint as needed
async function deleteTrades(ids: string[]): Promise<{ success: boolean; error?: string }> {
  // Replace with: await fetch(`/api/trades?ids=${ids.join(',')}`, { method: 'DELETE' })
  await new Promise(res => setTimeout(res, 600));
  return { success: true };
}
async function tagTrades(ids: string[], tags: string[]): Promise<{ success: boolean; error?: string }> {
  // Replace with: await fetch(`/api/trades/tag`, ...)
  await new Promise(res => setTimeout(res, 500));
  return { success: true };
}

export function TradeTable({ filters = {}, onRowClick }: {
  filters?: Record<string, any>;
  onRowClick: (trade: Trade) => void;
}) {
  // TODO: Replace with real data fetch + TanStack/react-virtual
  const [rows, setRows] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Bulk delete dialog state
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  // Bulk tag dialog state
  const [showTag, setShowTag] = useState(false);
  const [tagInput, setTagInput] = useState("");

  // Simulate fetch
  useEffect(() => {
    setLoading(true);
    // Replace with real API call
    setTimeout(() => {
      setRows([
        { id: '1', symbol: 'AAPL', assetType: 'Stock', side: 'Buy', quantity: 100, avgEntry: 180.23, avgExit: 185.12, fees: 2.5, pnl: 487.5, grossPnl: 490, date: '2024-06-07', closeDate: '2024-06-08', tags: ['Tech'], notes: 'Good trade', strategy: 'Breakout', rMultiple: 2.3 },
        { id: '2', symbol: 'NVDA', assetType: 'Stock', side: 'Sell', quantity: 50, avgEntry: 110.10, avgExit: 108.02, fees: 1.5, pnl: -104, grossPnl: -102.5, date: '2024-06-06', closeDate: '2024-06-07', tags: ['AI'], notes: '', strategy: 'Reversal', rMultiple: -1.0 },
      ]);
      setLoading(false);
      setSelected(new Set());
    }, 500);
  }, [JSON.stringify(filters)]);

  const allSelected = rows.length > 0 && selected.size === rows.length;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelected(new Set(rows.map((t) => t.id)));
    else setSelected(new Set());
  };

  const handleRowSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getSelectedRows = () => rows.filter((t) => selected.has(t.id));
  const selectedRows = getSelectedRows();

  const onExport = async () => {
    try {
      setLoading(true);
      const blob = await exportTradesCsv(filters);
      downloadBlob(blob, `trades-${new Date().toISOString().slice(0,10)}.csv`);
      toast.success("CSV exported.");
    } catch (e: any) {
      toast.error("CSV export failed: " + (e?.message ?? "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const onDeleteSelected = async () => {
    if (selectedRows.length === 0) return;
    setShowDelete(true);
  };

  const confirmDelete = async () => {
    if (deleteConfirm !== String(selectedRows.length)) return;
    setLoading(true);
    const ids = selectedRows.map((r) => r.id);
    const res = await deleteTrades(ids);
    setShowDelete(false);
    setDeleteConfirm("");
    if (res.success) {
      toast.success(`Deleted ${ids.length} trades.`);
      setRows((prev) => prev.filter((t) => !ids.includes(t.id)));
      setSelected(new Set());
    } else {
      toast.error(res.error || "Failed to delete");
    }
    setLoading(false);
  };

  const onTagSelected = () => setShowTag(true);
  const confirmTag = async () => {
    if (!tagInput.trim() || selectedRows.length === 0) return;
    setLoading(true);
    const ids = selectedRows.map((r) => r.id);
    const tags = tagInput.split(",").map((t) => t.trim());
    const res = await tagTrades(ids, tags);
    setShowTag(false);
    setTagInput("");
    if (res.success) {
      toast.success(`Tagged ${ids.length} trades.`);
      // Simulate update
      setRows((prev) => prev.map(t => ids.includes(t.id) ? ({ ...t, tags }) : t));
    } else {
      toast.error(res.error || "Failed to tag");
    }
    setLoading(false);
  };

  // Keyboard/ARIA support per row
  const handleRowKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Enter' || e.key === ' ') onRowClick(rows[idx]);
    if (e.key === 'ArrowDown' && idx < rows.length - 1) {
      (document.querySelector(`#trade-row-${idx + 1}`) as HTMLElement)?.focus();
    }
    if (e.key === 'ArrowUp' && idx > 0) {
      (document.querySelector(`#trade-row-${idx - 1}`) as HTMLElement)?.focus();
    }
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 p-2 rounded border bg-muted/50">
        <div className="flex gap-2 items-center">
          <button
            aria-label="Export CSV"
            disabled={loading}
            className="px-3 py-1 rounded bg-primary text-white hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-ring"
            onClick={onExport}
            tabIndex={0}
            type="button"
          >Export CSV</button>
          <button
            aria-label="Delete Selected Trades"
            disabled={selected.size === 0 || loading}
            onClick={onDeleteSelected}
            className="px-3 py-1 rounded bg-destructive text-white hover:bg-destructive/80 focus:outline-none focus:ring-2 focus:ring-ring"
            tabIndex={0}
            type="button"
          >Delete Selected</button>
          <button
            aria-label="Tag Selected Trades"
            disabled={selected.size === 0 || loading}
            onClick={onTagSelected}
            className="px-3 py-1 rounded bg-accent text-black hover:bg-accent/80 focus:outline-none focus:ring-2 focus:ring-ring"
            tabIndex={0}
            type="button"
          >Tag Selected</button>
        </div>
        <span className="text-sm text-muted-foreground">{selected.size} selected of {rows.length}</span>
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left border rounded">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                aria-label="Select all rows"
                checked={allSelected}
                onChange={handleSelectAll}
              />
            </th>
            <th>Date</th>
            <th>Symbol</th>
            <th>Asset</th>
            <th>Side</th>
            <th>Qty</th>
            <th>Avg Entry</th>
            <th>Avg Exit</th>
            <th>P&L</th>
            <th>Tags</th>
            <th>...</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={11} className="py-12 text-center">Loading…</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={11} className="py-12 text-center text-muted-foreground">No trades found</td></tr>
          ) : (
            rows.map((trade, i) => (
              <tr
                key={trade.id}
                tabIndex={0}
                aria-label={`Trade row ${i + 1} symbol ${trade.symbol}`}
                className={`focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer hover:bg-accent ${selected.has(trade.id) ? 'bg-accent/30' : ''}`}
                id={`trade-row-${i}`}
                onClick={() => onRowClick(trade)}
                onKeyDown={e => handleRowKey(e, i)}
              >
                <td>
                  <input
                    aria-label={`Select trade ${trade.symbol}`}
                    type="checkbox"
                    checked={selected.has(trade.id)}
                    onChange={() => handleRowSelect(trade.id)}
                    tabIndex={0}
                  />
                </td>
                <td>{compactDate(trade.date)}</td>
                <td>{trade.symbol}</td>
                <td>{trade.assetType}</td>
                <td>{trade.side}</td>
                <td>{trade.quantity}</td>
                <td>{fmtCurrency(trade.avgEntry)}</td>
                <td>{fmtCurrency(trade.avgExit)}</td>
                <td>
                  <span className={`inline-block min-w-[60px] text-center px-2 py-1 rounded font-semibold ${pnlChipColor(trade.pnl)}`}>{fmtCurrency(trade.pnl)}</span>
                </td>
                <td>
                  {trade.tags?.length > 0 ? trade.tags.map((tag) => (
                    <span key={tag} className="inline-block bg-muted px-1.5 py-0.5 rounded text-xs mr-1">{tag}</span>
                  )) : <span className="text-muted-foreground">—</span>}
                </td>
                <td>...</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>

      {/* Delete confirm dialog */}
      {showDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="bg-popover border border-border shadow-lg rounded p-6 min-w-[320px]">
            <h3 className="font-bold text-lg mb-2 text-destructive">Delete {selectedRows.length} trades?</h3>
            <p className="mb-2">Type <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">{selectedRows.length}</span> below to confirm this bulk delete.</p>
            <input
              className="p-2 border rounded w-full mb-4"
              aria-label="type number of trades to confirm delete"
              autoFocus
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDelete(false)} className="px-3 py-1 rounded border">Cancel</button>
              <button onClick={confirmDelete} disabled={deleteConfirm !== String(selectedRows.length)} className="px-3 py-1 rounded bg-destructive text-white disabled:opacity-60">Delete</button>
            </div>
          </div>
        </div>
      )}
      {/* Tag dialog */}
      {showTag && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="bg-popover border border-border shadow-lg rounded p-6 min-w-[320px]">
            <h3 className="font-bold text-lg mb-2">Tag {selectedRows.length} trades</h3>
            <p className="mb-2">Enter comma-separated tags to add to selected trades.</p>
            <input
              className="p-2 border rounded w-full mb-4"
              aria-label="bulk tag input"
              autoFocus
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              placeholder="tag1, tag2..."
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowTag(false)} className="px-3 py-1 rounded border">Cancel</button>
              <button onClick={confirmTag} disabled={!tagInput.trim() || loading} className="px-3 py-1 rounded bg-primary text-white disabled:opacity-60">Tag</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
