"use client";
import React, { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

interface TradingViewSymbolOverviewProps {
  symbol: string; // e.g. "NASDAQ:AAPL"
}

export default function TradingViewSymbolOverview({ symbol }: TradingViewSymbolOverviewProps) {
  const container = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!symbol || !container.current) return;
    container.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [[symbol]],
      chartOnly: false,
      width: "100%",
      height: 220,
      locale: "en",
      colorTheme: resolvedTheme === "dark" ? "dark" : "light",
      autosize: true,
      showVolume: true,
      showMA: true,
      hideDateRanges: false,
      hideMarketStatus: false,
      hideSymbolLogo: false,
      scalePosition: "right",
      scaleMode: "Normal",
      fontFamily: "inherit",
      noTimeScale: false,
      valuesTracking: "1",
      changeMode: "price-and-percent",
      chartType: "area",
    });
    container.current.appendChild(script);
  }, [symbol, resolvedTheme]);

  return (
    <div className="w-full my-4">
      <div ref={container} />
    </div>
  );
}
