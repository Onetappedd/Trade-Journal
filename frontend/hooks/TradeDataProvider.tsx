"use client";
import React, { createContext, useContext, useState, useCallback } from "react";

const TradeDataContext = createContext<{ refreshTrades: () => void }>({ refreshTrades: () => {} });

export function TradeDataProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const refreshTrades = useCallback(() => setRefreshKey((k) => k + 1), []);
  return (
    <TradeDataContext.Provider value={{ refreshTrades }}>
      {/* Pass refreshKey as a prop to children if needed */}
      {children}
    </TradeDataContext.Provider>
  );
}

export function useTradeData() {
  return useContext(TradeDataContext);
}
