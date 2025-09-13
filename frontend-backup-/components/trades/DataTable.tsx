"use client";
import type { Trade } from "@/lib/server/trades";
import { compactDate, fmtCurrency, pnlChipColor } from '@/lib/ui/formatters';
import { useState } from 'react';

export function DataTable({ data, onLoadMore, isLoading, hasMore }: {
  data: Trade[];
  onLoadMore?: () => void;
  isLoading?: boolean;
  hasMore?: boolean;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[950px] text-left border rounded mb-4">
        <thead>
          <tr>
            <th>Date (Open)</th>
            <th>Date (Close)</th>
            <th>Asset</th>
            <th>Symbol</th>
            <th>Qty</th>
            <th>Entry</th>
            <th>Exit</th>
            <th>Fees</th>
            <th>P&L</th>
            <th>Type</th>
            <th>Strike/Contract</th>
            <th>Extra</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr><td colSpan={12} className="py-16 text-center text-muted-foreground">Loading…</td></tr>
          )}
          {!isLoading && data.length === 0 && (
            <tr><td colSpan={12} className="py-12 text-center text-muted-foreground">No trades found</td></tr>
          )}
          {!isLoading && data.map((t, i) => (
            <tr
              key={t.id}
              onClick={() => setExpanded(expanded === String(t.id) ? null : String(t.id))}
              className={expanded === String(t.id) ? "bg-muted/40" : "hover:bg-muted/10"}
              style={{ cursor: "pointer" }}
            >
              <td>{compactDate(t.open_date)}</td>
              <td>{compactDate(t.close_date)}</td>
              <td className="capitalize">{t.asset_type}</td>
              <td>{t.symbol}</td>
              <td>{t.qty ?? "—"}</td>
              <td>{fmtCurrency(t.avg_entry)}</td>
              <td>{fmtCurrency(t.avg_exit)}</td>
              <td>{fmtCurrency(t.fees)}</td>
              <td><span className={pnlChipColor(t.realized_pnl)}>{fmtCurrency(t.realized_pnl)}</span></td>
              <td className="capitalize">
                {t.asset_type === "option" ? t.option_type : t.asset_type === "futures" ? "Futures" : t.asset_type === "crypto" ? "Crypto" : "Stock"}
              </td>
              <td>
                {t.asset_type === "option" ? t.strike : t.asset_type === "futures" ? t.contract : "—"}
              </td>
              <td>
                {t.asset_type === "option" ? t.expiry : t.asset_type === "futures" ? t.tick_value : t.asset_type === "crypto" ? t.quote_currency : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {hasMore ? (
        <div className="flex justify-center mb-6"><button className="border rounded px-4 py-2" onClick={onLoadMore}>Load More</button></div>
      ) : null}
    </div>
  );
}
