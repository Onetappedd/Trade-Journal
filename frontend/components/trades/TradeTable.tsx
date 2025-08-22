"use client";
import React, { useState } from "react";
import { useTrades } from '@/hooks/useTrades';
import { Trade, AssetType } from '@/types/trade';
import { computeRealizedPnl } from '@/lib/trades';
import { compactDate, fmtCurrency, pnlChipColor } from '@/lib/ui/formatters';

export function TradeTable({ filters, onRowClick }: {
  filters: Record<string, any>;
  onRowClick: (trade: Trade) => void;
}) {
  const [page, setPage] = useState(1);
  const { data: rows, total, isLoading, error } = useTrades({ ...filters }, { page });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Selection
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
  const handleRowKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Enter' || e.key === ' ') onRowClick(rows[idx]);
    if (e.key === 'ArrowDown' && idx < rows.length - 1) {
      (document.querySelector(`#trade-row-${idx + 1}`) as HTMLElement)?.focus();
    }
    if (e.key === 'ArrowUp' && idx > 0) {
      (document.querySelector(`#trade-row-${idx - 1}`) as HTMLElement)?.focus();
    }
  };

  // Columns (dynamic based on asset type)
  const commonHeaders = ["Date", "Symbol", "Asset", "Side", "Qty", "Open", "Close", "Fees", "P&L", "Tags", "Status"];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left border rounded">
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
            {commonHeaders.map((hdr) => <th key={hdr}>{hdr}</th>)}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={commonHeaders.length + 1} className="py-12 text-center">Loading…</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={commonHeaders.length + 1} className="py-12 text-center text-muted-foreground">No trades found</td></tr>
          ) : (
            rows.map((trade, i) => {
              const { pnl, pnlPct } = computeRealizedPnl(trade);
              return (
                <React.Fragment key={trade.id}>
                  <tr
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
                    <td>{compactDate(trade.openedAt)}</td>
                    <td>{trade.symbol}</td>
                    <td className="capitalize">{trade.assetType}</td>
                    <td className="capitalize">{trade.side}</td>
                    <td>{trade.quantity}</td>
                    <td>{fmtCurrency(trade.openPrice)}</td>
                    <td>{trade.closePrice != null ? fmtCurrency(trade.closePrice) : <span className="text-muted-foreground">—</span>}</td>
                    <td>{trade.fees != null ? fmtCurrency(trade.fees) : '—'}</td>
                    <td>
                      <span className={`inline-block min-w-[60px] text-center px-2 py-1 rounded font-semibold ${pnlChipColor(pnl)}`}>{fmtCurrency(pnl)}</span>
                      <span className="text-xs ml-2">{pnlPct ? pnlPct.toFixed(2) + "%" : ""}</span>
                    </td>
                    <td>
                      {trade.tags?.length ? trade.tags.map(tag => (
                        <span key={tag} className="inline-block bg-muted px-1.5 py-0.5 rounded text-xs mr-1">{tag}</span>
                      )) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="capitalize">{trade.status}</td>
                  </tr>
                  {/* Row details for non-stock types */}
                  {(trade.assetType !== 'stock') && (
                    <tr className="bg-card/50 text-sm">
                      <td></td>
                      <td colSpan={commonHeaders.length} className="p-2">
                        {trade.assetType === 'option' && (
                          <span>
                            <b>Type:</b> {trade.optionType != null ? trade.optionType : '—'} 
                            <b>Strike:</b> {('strike' in trade) ? trade.strike : '—'}
                            <b> Expiry:</b> {('expiration' in trade) ? compactDate((trade as any).expiration) : '—'}
                            <b> Multiplier:</b> {('multiplier' in trade) ? trade.multiplier : '—'}
                          </span>
                        )}
                        {trade.assetType === 'future' && (
                          <span>
                            <b>Contract:</b> {('contractCode' in trade) ? (trade as any).contractCode : '—'}
                            <b> Point Value:</b> {('pointValue' in trade) ? (trade as any).pointValue : '—'}
                          </span>
                        )}
                        {trade.assetType === 'crypto' && (
                          <span>
                            <b>Quote:</b> {('quoteCurrency' in trade) ? (trade as any).quoteCurrency : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
      <div className="flex items-center justify-end py-3 gap-2">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="px-3 py-1 rounded border text-sm disabled:opacity-60" aria-label="Previous Page"
        >Prev</button>
        <span className="text-sm">Page {page}</span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={rows.length < 50}
          className="px-3 py-1 rounded border text-sm disabled:opacity-60" aria-label="Next Page"
        >Next</button>
        <span className="text-muted-foreground ml-2">{total} total trades</span>
      </div>
    </div>
  );
}
