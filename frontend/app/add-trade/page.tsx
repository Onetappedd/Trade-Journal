// frontend/app/add-trade/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import dynamic from "next/dynamic";

import { useAuth } from "@/context/auth-provider";
import { supabase } from "@/lib/supabaseClient";

const TradingViewChart = dynamic(
  () => import("@/components/TradingViewChart"),
  { ssr: false }
);

const BROKERS = ["Webull", "Robinhood", "Schwab", "IBKR", "Other"];
const ASSET_TYPES = ["Stock", "Option", "Future", "Crypto"];
const SIDES = ["Buy", "Sell"];
const OPTION_TYPES = ["Call", "Put"];

export default function AddTradePage() {
  const { user } = useAuth();
  if (!user) return <p>Please log in to add trades.</p>;

  const [assetType, setAssetType] = useState("Stock");
  const [broker, setBroker] = useState(BROKERS[0]);
  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState("Buy");
  const [qty, setQty] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [entryTime, setEntryTime] = useState<Date | null>(new Date());
  const [exitTime, setExitTime] = useState<Date | null>(null);
  const [notes, setNotes] = useState("");

  // Option fields
  const [expiration, setExpiration] = useState("");
  const [strike, setStrike] = useState("");
  const [optionType, setOptionType] = useState("Call");

  // UI state
  const [showChart, setShowChart] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Duplicate detection
  const [userTrades, setUserTrades] = useState<any[]>([]);
  const [isDuplicate, setIsDuplicate] = useState(false);

  // Load existing trades for duplicate detection
  useEffect(() => {
    if (!user) return;
    supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (error) console.error(error);
        else setUserTrades(data || []);
      });
  }, [user]);

  // Check for duplicates
  useEffect(() => {
    if (!symbol || !side || !entryTime) {
      setIsDuplicate(false);
      return;
    }
    const entryIso =
      entryTime instanceof Date
        ? entryTime.toISOString().slice(0, 16)
        : "";
    setIsDuplicate(
      userTrades.some(
        (t) =>
          t.symbol === symbol &&
          t.side === side &&
          (t.entry_time || t.filled_time || "").slice(0, 16) === entryIso &&
          (t.asset_type || t.type) === assetType
      )
    );
  }, [symbol, side, entryTime, assetType, userTrades]);

  function validate() {
    if (!assetType) return "Asset type is required.";
    if (!broker) return "Broker is required.";
    if (!symbol) return "Symbol is required.";
    if (!side) return "Side is required.";
    if (!qty || isNaN(Number(qty)) || Number(qty) <= 0)
      return "Quantity must be a positive number.";
    if (!entryPrice || isNaN(Number(entryPrice)))
      return "Entry price is required and must be a number.";
    if (!entryTime) return "Entry time is required.";
    if (assetType === "Option") {
      if (!expiration) return "Expiration is required for options.";
      if (!strike || isNaN(Number(strike)))
        return "Strike is required and must be a number.";
      if (!optionType) return "Option type (Call/Put) is required.";
    }
    return "";
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }

    setFormError("");
    setSubmitting(true);

    const payload: any = {
      user_id: user.id,
      asset_type: assetType,
      broker,
      symbol,
      side,
      qty: Number(qty),
      entry_price: Number(entryPrice),
      exit_price: exitPrice ? Number(exitPrice) : null,
      entry_time: entryTime?.toISOString(),
      exit_time: exitTime?.toISOString(),
      notes,
    };

    if (assetType === "Option") {
      payload.expiration = expiration;
      payload.strike = Number(strike);
      payload.option_type = optionType;
    }

    const { data, error } = await supabase
      .from("trades")
      .insert([payload]);

    if (error) {
      setFormError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      // Optionally: reset form fields here
    }

    setSubmitting(false);
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 w-full bg-background text-foreground flex flex-col px-4 md:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Add Trade</h1>
        <form
          className="max-w-2xl mx-auto bg-card rounded-lg shadow p-6 flex flex-col gap-4"
          onSubmit={handleSubmit}
        >
          {/* Asset Type & Broker */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="font-semibold">Asset Type</label>
              <Select value={assetType} onValueChange={setAssetType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="font-semibold">Broker</label>
              <Select value={broker} onValueChange={setBroker}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BROKERS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Symbol & Chart Button */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="font-semibold">Ticker Symbol</label>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g. TSLA, BTC-USD"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowChart(true)}
              disabled={!symbol}
            >
              View Chart
            </Button>
          </div>

          {/* Options Fields */}
          {assetType === "Option" && (
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="font-semibold">Expiration Date</label>
                <Input
                  type="date"
                  value={expiration}
                  onChange={(e) => setExpiration(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="font-semibold">Strike Price</label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={strike}
                  onChange={(e) => setStrike(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="font-semibold">Call/Put</label>
                <Select value={optionType} onValueChange={setOptionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPTION_TYPES.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Date & Time */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="font-semibold">Entry Date & Time</label>
              <DateTimePicker value={entryTime} onChange={setEntryTime} />
            </div>
            <div className="flex-1">
              <label className="font-semibold">Exit Date & Time</label>
              <DateTimePicker value={exitTime} onChange={setExitTime} />
            </div>
          </div>

          {/* Prices & Quantity & Side */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="font-semibold">Entry Price</label>
              <Input
                type="number"
                min="0"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="font-semibold">Exit Price</label>
              <Input
                type="number"
                min="0"
                step="any"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="font-semibold">Quantity</label>
              <Input
                type="number"
                min="0"
                step="any"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="font-semibold">Side</label>
              <Select value={side} onValueChange={setSide}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIDES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="font-semibold">Notes</label>
            <Textarea
              rows={3}
              placeholder="Trade notes, rationale, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Form Errors & Success */}
          {formError && <div className="text-red-600 text-center">{formError}</div>}
          {success && <div className="text-green-600 text-center">Trade added successfully!</div>}

          {/* Submit & Duplicate Warning */}
          <div className="flex gap-4 justify-end items-center">
            {isDuplicate && (
              <div className="text-red-600 text-sm flex-1">
                Duplicate trade detected. Please check your entry.
              </div>
            )}
            <Button type="submit" disabled={submitting || isDuplicate}>
              {submitting ? "Adding..." : "Add Trade"}
            </Button>
          </div>
        </form>

        {/* Chart Modal */}
        {showChart && symbol && (
          <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
            onClick={() => setShowChart(false)}
          >
            <div
              className="bg-card rounded-lg shadow-lg p-6 min-w-[320px] max-w-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-2">{symbol} Chart</h2>
              <TradingViewChart />
              <Button className="mt-4 w-full" onClick={() => setShowChart(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
);
}
