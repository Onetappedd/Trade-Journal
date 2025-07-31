"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Chart as ChartJS, registerables } from "chart.js";
import { CandlestickController, CandlestickElement } from "chartjs-chart-financial";
import { Chart as ReactChart } from "react-chartjs-2";
import 'chartjs-adapter-date-fns';
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";

ChartJS.register(...registerables, CandlestickController, CandlestickElement);

import { Suspense } from "react";
// ...other imports remain unchanged

export default function ChartVisualizerPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 w-full bg-background text-foreground flex flex-col px-4 md:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Chart Visualizer</h1>
        <Suspense fallback={<div>Loading...</div>}>
          <ChartVisualizerContent />
        </Suspense>
      </div>
    </div>
  );
}

function ChartVisualizerContent() {
  const searchParams = useSearchParams();
  const tradeId = searchParams.get("tradeId");
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tradeId) return;
    setLoading(true);
    setError("");
    // Fetch trade info first to get symbol and time range
    fetch(`/api/completed-trades?tradeId=${tradeId}`)
      .then(res => res.json())
      .then(async data => {
        const trade = (data.completed_trades || []).find((t: any) => t.trade_ids?.includes(Number(tradeId)));
        if (!trade) {
          setError("Trade not found");
          setLoading(false);
          return;
        }
        // Use entry/exit time for chart window
        const symbol = trade.ticker || trade.symbol;
        const start = trade.entry_time?.slice(0, 19) || trade.filled_time?.slice(0, 19);
        const end = trade.exit_time?.slice(0, 19) || trade.filled_time?.slice(0, 19);
        if (!symbol || !start || !end) {
          setError("Trade missing symbol or time info");
          setLoading(false);
          return;
        }
        // Pad window for context
        const startDate = new Date(new Date(start).getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19);
        const endDate = new Date(new Date(end).getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19);
        // Fetch chart data
        const chartRes = await fetch(`/api/chart-data?symbol=${symbol}&start_date=${startDate}&end_date=${endDate}&trade_ids=${tradeId}`);
        const chartJson = await chartRes.json();
        setChartData({ chart: chartJson, trade });
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch chart data");
        setLoading(false);
      });
  }, [tradeId]);

  // Chart.js candlestick data format
  const getChartJsData = () => {
    if (!chartData) return { datasets: [] };
    const ohlc = chartData.chart.ohlc.map((d: any) => ({
      x: new Date(d.timestamp),
      o: d.open,
      h: d.high,
      l: d.low,
      c: d.close,
    }));
    // Entry/exit markers
    const trade = chartData.trade;
    const entryIdx = ohlc.findIndex((d: any) => new Date(d.x) >= new Date(trade.entry_time));
    const exitIdx = trade.exit_time ? ohlc.findIndex((d: any) => new Date(d.x) >= new Date(trade.exit_time)) : -1;
    // Markers for entry/exit
    const entryMarker = entryIdx >= 0 ? [{ x: ohlc[entryIdx].x, y: ohlc[entryIdx].o }] : [];
    const exitMarker = exitIdx >= 0 ? [{ x: ohlc[exitIdx].x, y: ohlc[exitIdx].c }] : [];
    // Color for P&L
    const pnl = trade.realized_pnl ?? ((trade.exit_price ?? 0) - (trade.entry_price ?? 0)) * (trade.quantity ?? 0);
    const color = pnl > 0 ? "#22c55e" : pnl < 0 ? "#ef4444" : "#eab308";
    return {
      datasets: [
        {
          label: `${trade.symbol} Candles`,
          data: ohlc,
          type: "candlestick",
          borderColor: "#888",
          borderWidth: 1,
        },
        {
          label: "Entry",
          data: entryMarker,
          type: "scatter",
          pointStyle: "circle",
          pointRadius: 7,
          backgroundColor: color,
          borderColor: color,
          showLine: false,
        },
        {
          label: "Exit",
          data: exitMarker,
          type: "scatter",
          pointStyle: "triangle",
          pointRadius: 9,
          backgroundColor: color,
          borderColor: color,
          showLine: false,
        },
        // Connect entry/exit
        entryMarker.length && exitMarker.length ? {
          label: "Trade Line",
          data: [entryMarker[0], exitMarker[0]],
          type: "line",
          borderColor: color,
          borderDash: [6, 6],
          borderWidth: 2,
          fill: false,
          pointRadius: 0,
        } : null,
      ].filter((d) => d !== null),
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function(context: any) {
            if (context.dataset.label === "Entry" || context.dataset.label === "Exit") {
              const t = chartData?.trade;
              return `${context.dataset.label}: ${context.parsed.y}\nQty: ${t?.quantity ?? t?.qty}\nTime: ${context.parsed.x}`;
            }
            if (context.dataset.type === "candlestick") {
              const d = context.raw;
              return `O: ${d.o} H: ${d.h} L: ${d.l} C: ${d.c}`;
            }
            return context.dataset.label;
          }
        }
      },
      zoom: {
        pan: { enabled: true, mode: "x" },
        zoom: { enabled: true, mode: "x" },
      },
    },
    scales: {
      x: { type: "timeseries", time: { unit: "day" }, title: { display: true, text: "Time" } },
      y: { title: { display: true, text: "Price" } },
    },
  };

  return (
    <>
      {loading ? <div>Loading...</div> : error ? <div className="text-red-600">{error}</div> : (
        chartData && (
          <div>
            <div className="mb-4">
              <b>Trade:</b> {chartData.trade.symbol} {chartData.trade.type} {chartData.trade.side} Qty: {chartData.trade.quantity ?? chartData.trade.qty} Entry: {chartData.trade.entry_price ?? chartData.trade.price} Exit: {chartData.trade.exit_price ?? "-"} P&L: {chartData.trade.realized_pnl?.toFixed(2) ?? "-"}
            </div>
            <div style={{ width: "100%", maxWidth: 900, height: 500 }}>
              <ReactChart type="candlestick" data={getChartJsData() as any} options={chartOptions as any} />
            </div>
          </div>
        )
      )}
    </>
  );
}
