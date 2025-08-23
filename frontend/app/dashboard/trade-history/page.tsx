import { useState } from "react";
import { FiltersBar } from "@/components/trades/FiltersBar";
import { SummaryHeader } from "@/components/history/SummaryHeader";
import { EquityCurve } from "@/components/history/EquityCurve";
import { CalendarHeatmap } from "@/components/history/CalendarHeatmap";
import { Breakdowns } from "@/components/history/Breakdowns";
import { usePersistedState } from "@/lib/ui/persist";
import { toast } from "@/components/ui/sonner";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

// Persist filter state by default
const PERSIST_KEY = "tradingjournal:history:filters:v1";

export default function TradeHistoryPage() {
  const [filters, setFilters, resetFilters] = usePersistedState(PERSIST_KEY, {});
  const [visibleWidgets] = useState<string[]>(["SummaryHeader","EquityCurve","CalendarHeatmap","Breakdowns"]);

  const saveReport = () => {
    try {
      const prev: any[] = JSON.parse(localStorage.getItem("tradingjournal:history:reports:v1") || "[]");
      const next = [...prev, { filters, widgets: visibleWidgets, saved: new Date().toISOString() }];
      localStorage.setItem("tradingjournal:history:reports:v1", JSON.stringify(next));
      toast.success("Report view saved");
    } catch {
      toast.error("Could not save report");
    }
  };
  const copyLink = () => {
    try {
      const url = new URL(window.location.href);
      url.search = "";
      Object.entries(filters || {}).forEach(([k,v]) => {
        if (v != null && v !== "") url.searchParams.set(k, String(v));
      });
      navigator.clipboard.writeText(url.toString());
      toast.success("Share link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };
  const resetReport = () => {
    resetFilters();
    toast.success("Report reset");
  };

  return (
    <div className="max-w-7xl mx-auto flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-wrap gap-2 justify-between items-center mb-3">
        <h1 className="text-2xl font-bold mb-2">Trade History</h1>
        <div className="flex gap-2">
          <button
            type="button"
            className="bg-primary text-white rounded px-3 py-1.5 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Save report"
            onClick={saveReport}
          >Save Report</button>
          <button
            type="button"
            className="bg-accent text-black rounded px-3 py-1.5 hover:bg-accent/80 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Copy share link"
            onClick={copyLink}
          >Copy share link</button>
          <button
            type="button"
            className="bg-muted text-foreground rounded px-3 py-1.5 border hover:bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Reset report"
            onClick={resetReport}
          >Reset report</button>
        </div>
      </div>
      <FiltersBar filters={filters} onChange={setFilters} small />
      <SummaryHeader filters={filters} />
      <EquityCurve filters={filters} />
      <CalendarHeatmap filters={filters} />
      <Breakdowns filters={filters} onFilter={setFilters} />
    </div>
  );
}
