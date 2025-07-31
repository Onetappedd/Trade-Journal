"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Trade } from "@/lib/data/mock-trades";
import { useAuth } from "@/components/auth-provider";

interface TradeStoreContextType {
  trades: Trade[];
  addTrade: (trade: Trade) => void;
  updateTrade: (id: string, trade: Trade) => void;
  getTrade: (id: string) => Trade | undefined;
}

const TradeStoreContext = createContext<TradeStoreContextType | undefined>(undefined);

export function TradeStoreProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);

  // Load trades for the current user
  useEffect(() => {
    if (typeof window !== "undefined" && user?.email) {
      const stored = localStorage.getItem(`trades_${user.email}`);
      setTrades(stored ? JSON.parse(stored) : []);
    } else {
      setTrades([]);
    }
  }, [user?.email, isAuthenticated]);

  // Persist trades to localStorage for the current user
  useEffect(() => {
    if (typeof window !== "undefined" && user?.email) {
      localStorage.setItem(`trades_${user.email}`, JSON.stringify(trades));
    }
  }, [trades, user?.email]);

  const addTrade = (trade: Trade) => {
    setTrades((prev) => [{ ...trade, id: (Date.now() + Math.random()).toString() }, ...prev]);
  };

  const updateTrade = (id: string, updated: Trade) => {
    setTrades((prev) => prev.map((t) => (t.id === id ? { ...updated, id } : t)));
  };

  const getTrade = (id: string) => trades.find((t) => t.id === id);

  return (
    <TradeStoreContext.Provider value={{ trades, addTrade, updateTrade, getTrade }}>
      {children}
    </TradeStoreContext.Provider>
  );
}

export function useTradeStore() {
  const ctx = useContext(TradeStoreContext);
  if (!ctx) throw new Error("useTradeStore must be used within a TradeStoreProvider");
  return ctx;
}
