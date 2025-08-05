"use client"

import React, { useEffect, useRef, memo } from 'react';

function TradingViewWidget() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "symbols": [
          {
            "proName": "SP:SPX",
            "title": "S&P 500 Index"
          },
          {
            "proName": "NASDAQ:NDX",
            "title": "Nasdaq 100 Index"
          },
          {
            "proName": "NASDAQ:NVDA",
            "title": "NVDA"
          },
          {
            "proName": "NASDAQ:AAPL",
            "title": "AAPL"
          },
          {
            "proName": "NASDAQ:TSLA",
            "title": "TSLA"
          },
          {
            "proName": "NASDAQ:GOOGL",
            "title": "GOOGL"
          },
          {
            "proName": "NASDAQ:MSFT",
            "title": "MSFT"
          },
          {
            "proName": "NASDAQ:AMZN",
            "title": "AMZN"
          },
          {
            "proName": "NASDAQ:META",
            "title": "META"
          },
          {
            "proName": "CRYPTO:BTCUSD",
            "title": "Bitcoin"
          },
          {
            "proName": "CRYPTO:ETHUSD",
            "title": "Ethereum"
          }
        ],
        "colorTheme": "dark",
        "locale": "en",
        "largeChartUrl": "",
        "isTransparent": false,
        "showSymbolLogo": true,
        "displayMode": "adaptive"
      }`;

    container.current.appendChild(script);

    // Cleanup function to remove script when component unmounts
    return () => {
      if (container.current) {
        const scripts = container.current.querySelectorAll('script');
        scripts.forEach(script => script.remove());
      }
    };
  }, []);

  return (
    <div className="mt-4 rounded-lg overflow-hidden">
      <div className="tradingview-widget-container" ref={container}>
        <div className="tradingview-widget-container__widget"></div>
        <div className="tradingview-widget-copyright">
          <a 
            href="https://www.tradingview.com/" 
            rel="noopener nofollow" 
            target="_blank"
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            <span className="blue-text">Ticker tape by TradingView</span>
          </a>
        </div>
      </div>
    </div>
  );
}

// Export as FinancialTicker to maintain compatibility with existing imports
export const FinancialTicker = memo(TradingViewWidget);
export default memo(TradingViewWidget);