"use client";
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import dynamic from "next/dynamic";
import { useAuth } from "@/components/auth-provider";
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Box from '@mui/material/Box';

const TradingViewChart = dynamic(() => import("@/components/TradingViewChart"), { ssr: false });

const BROKERS = ["Webull", "Robinhood", "Schwab", "IBKR", "Other"];
const ASSET_TYPES = ["Stock", "Option", "Future", "Crypto"];
const SIDES = ["Buy", "Sell"];
const OPTION_TYPES = ["Call", "Put"];

const steps = [
  "Asset Type & Details",
  "Entry Info",
  "Exit & Risk",
  "Notes",
  "Review & Confirm"
];

export default function AddTradeStepperPage() {
  const { token } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  // Step 1
  const [assetType, setAssetType] = useState("Stock");
  const [broker, setBroker] = useState(BROKERS[0]);
  const [symbol, setSymbol] = useState("");
  const [expiration, setExpiration] = useState("");
  const [strike, setStrike] = useState("");
  const [optionType, setOptionType] = useState("Call");
  // Step 2
  const [side, setSide] = useState("Buy");
  const [entryPrice, setEntryPrice] = useState("");
  const [qty, setQty] = useState("");
  // Step 3
  const [exitPrice, setExitPrice] = useState("");
  const [entryTime, setEntryTime] = useState<Date | null>(new Date());
  const [exitTime, setExitTime] = useState<Date | null>(null);
  // Step 4
  const [notes, setNotes] = useState("");
  // UI state
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function validateStep() {
    if (activeStep === 0) {
      if (!assetType) return "Asset type is required.";
      if (!broker) return "Broker is required.";
      if (!symbol) return "Symbol is required.";
      if (assetType === "Option") {
        if (!expiration) return "Expiration is required for options.";
        if (!strike || isNaN(Number(strike))) return "Strike is required and must be a number.";
        if (!optionType) return "Option type (Call/Put) is required.";
      }
    }
    if (activeStep === 1) {
      if (!side) return "Side is required.";
      if (!entryPrice || isNaN(Number(entryPrice))) return "Entry price is required and must be a number.";
      if (!qty || isNaN(Number(qty)) || Number(qty) <= 0) return "Quantity must be a positive number.";
    }
    if (activeStep === 2) {
      if (!entryTime) return "Entry time is required.";
      if (exitPrice && isNaN(Number(exitPrice))) return "Exit price must be a number.";
    }
    return "";
  }

  function handleNext() {
    const err = validateStep();
    if (err) {
      setFormError(err);
      return;
    }
    setFormError("");
    setActiveStep(s => Math.min(s + 1, steps.length - 1));
  }
  function handleBack() {
    setFormError("");
    setActiveStep(s => Math.max(s - 1, 0));
  }
  async function handleSubmit() {
    const err = validateStep();
    if (err) {
      setFormError(err);
      return;
    }
    if (!token) {
      setFormError("You must be logged in to add a trade.");
      return;
    }
    setFormError("");
    setSubmitting(true);
    // Build payload
    const payload: any = {
      type: assetType,
      broker,
      symbol,
      side,
      qty: Number(qty),
      entryPrice: Number(entryPrice),
      exitPrice: exitPrice ? Number(exitPrice) : undefined,
      entryTime: entryTime?.toISOString(),
      exitTime: exitTime?.toISOString(),
      status: "Filled",
      notes,
    };
    if (assetType === "Option") {
      payload.expiration = expiration;
      payload.strike = Number(strike);
      payload.optionType = optionType;
    }
    const res = await fetch("/api/add-trade", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setActiveStep(0);
    } else {
      const data = await res.json();
      setFormError(data?.message || "Failed to add trade.");
    }
    setSubmitting(false);
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 w-full bg-background text-foreground flex flex-col items-center px-4 md:px-8 py-8 overflow-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Add Trade</h1>
        <Box sx={{ width: '100%', maxWidth: 700 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
        <form className="max-w-2xl w-full mx-auto bg-card rounded-lg shadow p-8 flex flex-col gap-6 items-center mt-8" onSubmit={e => { e.preventDefault(); activeStep === steps.length - 1 ? handleSubmit() : handleNext(); }}>
          {activeStep === 0 && (
            <>
              <div className="flex flex-col md:flex-row gap-6 w-full">
                <div className="flex-1 min-w-[180px]">
                  <label className="font-semibold">Asset Type</label>
                  <Select value={assetType} onValueChange={setAssetType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ASSET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[180px]">
                  <label className="font-semibold">Broker</label>
                  <Select value={broker} onValueChange={setBroker}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BROKERS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-6 w-full items-end">
                <div className="flex-1 min-w-[180px]">
                  <label className="font-semibold">Ticker Symbol</label>
                  <Input value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} placeholder="e.g. TSLA, BTC-USD" className="h-12 text-lg" />
                </div>
              </div>
              {symbol && (
                <div className="w-full flex justify-center my-4">
                  <div className="bg-card rounded-lg shadow-lg p-4 w-full max-w-2xl">
                    <TradingViewChart />
                  </div>
                </div>
              )}
              {assetType === "Option" && (
                <div className="flex flex-col md:flex-row gap-6 w-full">
                  <div className="flex-1 min-w-[180px]">
                    <label className="font-semibold">Expiration Date</label>
                    <Input value={expiration} onChange={e => setExpiration(e.target.value)} placeholder="YYYY-MM-DD" type="date" className="h-12 text-lg" />
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <label className="font-semibold">Strike Price</label>
                    <Input value={strike} onChange={e => setStrike(e.target.value)} type="number" min="0" step="any" className="h-12 text-lg" />
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <label className="font-semibold">Call/Put</label>
                    <Select value={optionType} onValueChange={setOptionType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {OPTION_TYPES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </>
          )}
          {activeStep === 1 && (
            <>
              <div className="flex flex-col md:flex-row gap-6 w-full">
                <div className="flex-1 min-w-[180px]">
                  <label className="font-semibold">Side</label>
                  <Select value={side} onValueChange={setSide}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SIDES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[180px]">
                  <label className="font-semibold">Entry Price</label>
                  <Input value={entryPrice} onChange={e => setEntryPrice(e.target.value)} type="number" min="0" step="any" className="h-12 text-lg" />
                </div>
                <div className="flex-1 min-w-[180px]">
                  <label className="font-semibold">Quantity</label>
                  <Input value={qty} onChange={e => setQty(e.target.value)} type="number" min="0" step="any" className="h-12 text-lg" />
                </div>
              </div>
            </>
          )}
          {activeStep === 2 && (
            <>
              <div className="flex flex-col md:flex-row gap-6 w-full">
                <div className="flex-1 min-w-[180px]">
                  <label className="font-semibold">Entry Date & Time</label>
                  <DateTimePicker value={entryTime} onChange={setEntryTime} />
                </div>
                <div className="flex-1 min-w-[180px]">
                  <label className="font-semibold">Exit Date & Time</label>
                  <DateTimePicker value={exitTime} onChange={setExitTime} />
                </div>
                <div className="flex-1 min-w-[180px]">
                  <label className="font-semibold">Exit Price</label>
                  <Input value={exitPrice} onChange={e => setExitPrice(e.target.value)} type="number" min="0" step="any" className="h-12 text-lg" />
                </div>
              </div>
            </>
          )}
          {activeStep === 3 && (
            <div className="w-full">
              <label className="font-semibold">Notes</label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Trade notes, rationale, etc." className="w-full text-lg" />
            </div>
          )}
          {activeStep === 4 && (
            <>
              <div className="mb-4 text-lg font-semibold">Review & Confirm</div>
              <div className="bg-muted rounded p-4 mb-4 w-full">
                <div><b>Asset Type:</b> {assetType}</div>
                <div><b>Broker:</b> {broker}</div>
                <div><b>Symbol:</b> {symbol}</div>
                {assetType === "Option" && <><div><b>Expiration:</b> {expiration}</div><div><b>Strike:</b> {strike}</div><div><b>Option Type:</b> {optionType}</div></>}
                <div><b>Side:</b> {side}</div>
                <div><b>Entry Price:</b> {entryPrice}</div>
                <div><b>Quantity:</b> {qty}</div>
                <div><b>Entry Time:</b> {entryTime?.toLocaleString()}</div>
                <div><b>Exit Time:</b> {exitTime?.toLocaleString()}</div>
                <div><b>Exit Price:</b> {exitPrice}</div>
                <div><b>Notes:</b> {notes}</div>
              </div>
            </>
          )}
          {formError && <div className="text-red-600 text-center">{formError}</div>}
          {success && <div className="text-green-600 text-center">Trade added successfully!</div>}
          <div className="flex gap-4 justify-center w-full">
            {activeStep > 0 && <Button type="button" variant="outline" onClick={handleBack}>Back</Button>}
            {activeStep < steps.length - 1 && <Button type="button" onClick={handleNext}>Next</Button>}
            {activeStep === steps.length - 1 && <Button type="submit" disabled={submitting}>{submitting ? "Adding..." : "Confirm & Add Trade"}</Button>}
          </div>
        </form>
      </div>
    </div>
  );
}
