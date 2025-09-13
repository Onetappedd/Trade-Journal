"use client";

import * as React from "react";
import { TickerDetailsDialog } from "./TickerDetailsDialog";

export interface TrendingRow {
  symbol: string;
  price?: number;
  changePct?: number;
}

export function TrendingClient({ rows }: { rows: TrendingRow[] }) {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<TrendingRow | null>(null);
  const openFor = (row: TrendingRow) => {
    setActive(row);
    setOpen(true);
  };
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2 pr-4">Symbol</th>
              <th className="py-2 pr-4">Price</th>
              <th className="py-2 pr-4">% Change</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((r) => (
              <tr key={r.symbol} className="border-t">
                <td className="py-2 pr-4 font-medium">{r.symbol}</td>
                <td className="py-2 pr-4">{r.price ?? "—"}</td>
                <td className="py-2 pr-4">{r.changePct ?? "—"}</td>
                <td className="py-2">
                  <button className="underline" onClick={() => openFor(r)}>
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TickerDetailsDialog
        isOpen={open}
        onOpenChange={setOpen}
        title={active?.symbol ?? "Details"}
        description={active ? `Quick snapshot for ${active.symbol}` : undefined}
      >
        {active ? (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Price:</span> {active.price ?? "—"}</div>
            <div><span className="text-muted-foreground">% Change:</span> {active.changePct ?? "—"}</div>
          </div>
        ) : null}
      </TickerDetailsDialog>
    </div>
  );
}
