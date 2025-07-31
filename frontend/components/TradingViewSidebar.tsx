"use client";
import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTheme } from "next-themes";

function TradingViewAdvancedChart({ symbol }: { symbol: string }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    if (!symbol || !chartRef.current) return;
    chartRef.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      if (window.TradingView) {
        // @ts-ignore
        new window.TradingView.widget({
          autosize: true,
          symbol: symbol,
          interval: "D",
          timezone: "Etc/UTC",
          theme: resolvedTheme === "dark" ? "dark" : "light",
          style: "1",
          locale: "en",
          toolbar_bg: "#f1f3f6",
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: "tradingview_advanced_chart",
          hide_top_toolbar: false,
          hide_legend: false,
          withdateranges: true,
          details: true,
          hotlist: true,
          calendar: true,
        });
      }
    };
    chartRef.current.appendChild(script);
  }, [symbol, resolvedTheme]);
  return <div id="tradingview_advanced_chart" ref={chartRef} style={{ minHeight: 700, height: 700, width: '100%', maxWidth: "100%" }} />;
}

function TradingViewTechnicalAnalysis({ symbol }: { symbol: string }) {
  return (
    <div className="w-full my-4">
      <iframe
        title="TradingView Technical Analysis"
        src={`https://s.tradingview.com/embed-widget/technical-analysis/?symbol=${encodeURIComponent(symbol)}&interval=1D&theme=dark&locale=en`}
        width="100%"
        height={350}
        frameBorder={0}
        className="rounded-md border"
        style={{ minHeight: 350, fontSize: 20 }}
      />
    </div>
  );
}

function TradingViewFundamentals({ symbol }: { symbol: string }) {
  return (
    <div className="w-full my-4">
      <iframe
        title="TradingView Fundamentals"
        src={`https://s.tradingview.com/embed-widget/financials/?symbol=${encodeURIComponent(symbol)}&interval=1D&theme=dark&locale=en`}
        width="100%"
        height={300}
        frameBorder={0}
        className="rounded-md border"
      />
    </div>
  );
}

function TradingViewNews({ symbol }: { symbol: string }) {
  const newsRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    if (!symbol || !newsRef.current) return;
    newsRef.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      feedMode: "symbol",
      symbol: symbol,
      colorTheme: resolvedTheme === "dark" ? "dark" : "light",
      isTransparent: false,
      displayMode: "regular",
      width: "100%",
      height: 400,
      locale: "en"
    });
    newsRef.current.appendChild(script);
  }, [symbol, resolvedTheme]);
  return <div ref={newsRef} style={{ minHeight: 400, width: "100%" }} />;
}

export default function TradingViewSidebar({ symbol, assetType }: { symbol: string; assetType: string }) {
  const [tab, setTab] = useState("chart");
  const isStockOrETF = assetType === "Common Stock" || assetType === "ETF";

  return (
    <aside className="w-full md:w-[900px] flex-shrink-0 md:ml-8 mt-8 md:mt-0 overflow-x-auto">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 mb-2">
          <TabsTrigger value="chart">Chart</TabsTrigger>
          <TabsTrigger value="ta">Technical Analysis</TabsTrigger>
          {isStockOrETF && <TabsTrigger value="fundamentals">Fundamentals</TabsTrigger>}
          <TabsTrigger value="news">News</TabsTrigger>
        </TabsList>
        <TabsContent value="chart">
          <Card><CardContent><TradingViewAdvancedChart symbol={symbol} /></CardContent></Card>
        </TabsContent>
        <TabsContent value="ta">
          <Card><CardContent><TradingViewTechnicalAnalysis symbol={symbol} /></CardContent></Card>
        </TabsContent>
        {isStockOrETF && (
          <TabsContent value="fundamentals">
            <Card><CardContent><TradingViewFundamentals symbol={symbol} /></CardContent></Card>
          </TabsContent>
        )}
        <TabsContent value="news">
          <Card><CardContent><TradingViewNews symbol={symbol} /></CardContent></Card>
        </TabsContent>
      </Tabs>
    </aside>
  );
}
