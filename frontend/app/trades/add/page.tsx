// frontend/app/trades/add/page.tsx
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Box from "@mui/material/Box";
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

const steps = [
  "Asset Type & Details",
  "Entry Info",
  "Exit & Risk",
  "Notes",
  "Review & Confirm",
];

export default function AddTradeStepperPage() {
  const { user } = useAuth();
  if (!user) return <p>Please log in to add trades.</p>;

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
        if (!expiration) return "Expiration is required.";
        if (!strike || isNaN(Number(strike)))
          return "Strike is required and must be a number.";
        if (!optionType) return "Option type is required.";
      }
    }
    if (activeStep === 1) {
      if (!side) return "Side is required.";
      if (!entryPrice || isNaN(Number(entryPrice)))
        return "Valid entry price is required.";
      if (!qty || isNaN(Number(qty)) || Number(qty) <= 0)
        return "Quantity must be > 0.";
    }
    if (activeStep === 2) {
      if (!entryTime) return "Entry time is required.";
      if (exitPrice && isNaN(Number(exitPrice)))
        return "Exit price must be a number.";
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
    setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  }
  function handleBack() {
    setFormError("");
    setActiveStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    const err = validateStep();
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
      status: "Filled",
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

    setSubmitting(false);
    if (error) {
      setFormError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setActiveStep(0);
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 px-4 py-8">
        <Box sx={{ width: "100%", maxWidth: 700 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
        <form
          className="max-w-2xl mx-auto bg-card rounded-lg shadow p-8 flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            activeStep === steps.length - 1 ? handleSubmit() : handleNext();
          }}
        >
          {/* ... your step markup ... */}
          {formError && (
            <div className="text-red-600 text-center">{formError}</div>
          )}
          {success && (
            <div className="text-green-600 text-center">Added successfully!</div>
          )}
          <div className="flex gap-4 justify-center">
            {activeStep > 0 && (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
            {activeStep < steps.length - 1 && (
              <Button onClick={handleNext}>Next</Button>
            )}
            {activeStep === steps.length - 1 && (
              <Button type="submit" disabled={submitting}>
                {submitting ? "Adding..." : "Confirm"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
