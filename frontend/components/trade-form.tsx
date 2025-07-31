"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { fetchCurrentPrice, fetchCompanyInfo } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { tradeSchema, TradeFormValues } from "../lib/validation/trade-schema";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { useRouter } from "next/navigation";
import { TagAutocomplete } from "./analytics/tag-autocomplete";
import TradingViewSymbolOverview from "@/components/TradingViewSymbolOverview";
import TradingViewSidebar from "@/components/TradingViewSidebar";
import { Resizable, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import OptionsChainLookup from "@/components/OptionsChainLookup";
import { useTradeData } from "@/hooks/useTradeData";

interface TradeFormProps {
  initialData?: Partial<TradeFormValues>;
  onSubmit?: (values: TradeFormValues) => void;
  isEditMode?: boolean;
}

export function TradeForm({ initialData, onSubmit, isEditMode }: TradeFormProps) {
  const router = useRouter();
  // Trade Status State
  const [tradeStatus, setTradeStatus] = React.useState<string>("Closed");

  const form = useForm<TradeFormValues>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      assetType: initialData?.assetType || "Common Stock",
      tradeStatus: initialData?.tradeStatus || "Closed",
      date: initialData?.date || "",
      symbol: initialData?.symbol || "",
      type: initialData?.type || undefined,
      entry: initialData?.entry || undefined,
      exit: initialData?.exit || undefined,
      positionSize: initialData?.positionSize || undefined,
      stopLoss: initialData?.stopLoss,
      takeProfit: initialData?.takeProfit,
      notes: initialData?.notes || "",
    },
    mode: "onChange",
  });
  const assetType = form.watch("assetType") || "Common Stock";
  const watchedSymbol = form.watch("symbol");
  const { currentPrice, companyInfo, isLoading } = useTradeData(watchedSymbol);

  // Watch for calculations
  const entry = form.watch("entry");
  const exit = form.watch("exit");
  const positionSize = form.watch("positionSize");
  const stopLoss = form.watch("stopLoss");
  const takeProfit = form.watch("takeProfit");

  // Calculate P&L
  const pnl = React.useMemo(() => {
    if (
      typeof entry === "number" &&
      typeof exit === "number" &&
      typeof positionSize === "number"
    ) {
      return ((exit - entry) * positionSize).toFixed(2);
    }
    return "-";
  }, [entry, exit, positionSize]);

  // Calculate R:R
  const rr = React.useMemo(() => {
    if (
      typeof entry === "number" &&
      typeof stopLoss === "number" &&
      typeof takeProfit === "number" &&
      stopLoss !== entry
    ) {
      const risk = Math.abs(entry - stopLoss);
      const reward = Math.abs(takeProfit - entry);
      if (risk > 0) {
        return (reward / risk).toFixed(2);
      }
    }
    return "-";
  }, [entry, stopLoss, takeProfit]);

  const symbol = form.watch("symbol") || "AAPL";
  const assetTypeValue = form.watch("assetType") || "Common Stock";
  return (
    <Resizable className="w-full min-h-screen flex flex-col md:flex-row justify-center items-start bg-background px-2 md:px-8 lg:px-16">
      <ResizablePanel defaultSize={50} minSize={30} maxSize={70} className="flex flex-col items-center justify-center">
        <Card className="w-full max-w-2xl mx-auto shadow-lg rounded-lg p-0">
          <CardHeader className="pb-0">
            <CardTitle>{isEditMode ? "Edit Trade" : "Add New Trade"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 p-0">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => {
                if (onSubmit) onSubmit(values);
                router.push("/trades");
              })}
              className="space-y-8"
              autoComplete="off"
            >
            {/* Asset Type Selector */}
            <div className="mb-6">
              <Card className="p-6">
                <CardTitle className="mb-4 text-lg">Asset Type</CardTitle>
                <div className="w-full max-w-md">
                  <Select value={form.watch("assetType")}
                    onValueChange={v => form.setValue("assetType", v as any)}>
                    <SelectTrigger className="bg-popover z-50 shadow-md">
                      <SelectValue placeholder="Select asset type" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50 shadow-md text-popover-foreground">
                      <SelectItem value="Common Stock">Common Stock</SelectItem>
                      <SelectItem value="Options Contract">Options Contract</SelectItem>
                      <SelectItem value="Futures Contract">Futures Contract</SelectItem>
                      <SelectItem value="Cryptocurrency">Cryptocurrency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            </div>
            {/* Trade Details Section (Dynamic by Asset Type) */}
            <div className="mb-6">
              {assetType === "Common Stock" && (
                <Card className="p-6">
                  <CardTitle className="mb-4 text-lg">Common Stock Details</CardTitle>
                  {/* Field #1: Trade Status, Trade date, Trade time (optional), Symbol */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <FormLabel>Trade Status</FormLabel>
                      <Select value={form.watch("tradeStatus")}
                        onValueChange={v => form.setValue("tradeStatus", v as any)}>
                        <SelectTrigger className="bg-popover z-50 shadow-md">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50 shadow-md text-popover-foreground">
                          <SelectItem value="Open">Open</SelectItem>
                          <SelectItem value="Closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trade Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormDescription>Date of trade</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tradeTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trade Time</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="HH:MM" {...field} />
                          </FormControl>
                          <FormDescription>Time of trade (e.g., 09:30)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="symbol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Symbol</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. AAPL" {...field} />
                          </FormControl>
                          <FormDescription>Stock symbol</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* TradingView Symbol Overview Widget */}
                    {form.watch("symbol") && (
                      <div className="md:col-span-3">
                        <TradingViewSymbolOverview symbol={`NASDAQ:${form.watch("symbol").toUpperCase()}`} />
                      </div>
                    )}
                  </div>
                  {/* Field #2: Direction, Entry Price, Quantity, Commission/fees (optional) */}
                  {(() => {
                    const v = form.getValues();
                    return (
                      v.tradeStatus && v.date && v.symbol &&
                      !form.formState.errors.tradeStatus &&
                      !form.formState.errors.date &&
                      !form.formState.errors.symbol
                    );
                  })() && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <FormField
                        control={form.control}
                        name="direction"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Direction</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-popover z-50 shadow-md">
                                  <SelectValue placeholder="Select direction" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-popover z-50 shadow-md text-popover-foreground">
                                <SelectItem value="Long">Long</SelectItem>
                                <SelectItem value="Short">Short</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="entry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Entry Price</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="positionSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity (Shares)</FormLabel>
                            <FormControl>
                              <Input type="number" step="1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="commissionFees"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Commission/Fees</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormDescription>Optional</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  {/* Field #3: Risk Management (Optional) */}
                  {(() => {
                    const v = form.getValues();
                    return (
                      v.direction && v.entry && v.positionSize &&
                      !form.formState.errors.direction &&
                      !form.formState.errors.entry &&
                      !form.formState.errors.positionSize
                    );
                  })() && (
                    <div className="mt-6">
                      <CardTitle className="mb-4 text-lg">Risk Management (Optional)</CardTitle>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="stopLoss"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Stop Loss</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormDescription>Optional</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="takeProfit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Take Profit</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormDescription>Optional</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                  {/* Field #4: Calculated Metrics */}
                  {(() => {
                    const v = form.getValues();
                    return (
                      v.direction && v.entry && v.positionSize &&
                      !form.formState.errors.direction &&
                      !form.formState.errors.entry &&
                      !form.formState.errors.positionSize
                    );
                  })() && (
                    <div className="mt-6">
                      <CardTitle className="mb-4 text-lg">Calculated Metrics</CardTitle>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <FormLabel>P&amp;L</FormLabel>
                          <div className={cn(
                            "mt-1 px-3 py-2 rounded-md border bg-background text-lg font-mono",
                            pnl !== "-" && (parseFloat(pnl) > 0 ? "text-success" : parseFloat(pnl) < 0 ? "text-destructive" : "")
                          )}>
                            {pnl !== "-" ? `${pnl}` : "-"}
                          </div>
                          <FormDescription>Calculated: (Exit - Entry) × Position Size</FormDescription>
                        </div>
                        <div>
                          <FormLabel>R:R</FormLabel>
                          <div className="mt-1 px-3 py-2 rounded-md border bg-background text-lg font-mono">
                            {rr !== "-" ? `${rr}:1` : "-"}
                          </div>
                          <FormDescription>Calculated: (Take Profit - Entry) / (Entry - Stop Loss)</FormDescription>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Field #5: Documentation (Optional) */}
                  {(() => {
                    const v = form.getValues();
                    return (
                      v.direction && v.entry && v.positionSize &&
                      !form.formState.errors.direction &&
                      !form.formState.errors.entry &&
                      !form.formState.errors.positionSize
                    );
                  })() && (
                    <div className="mt-6">
                      <CardTitle className="mb-4 text-lg">Documentation (Optional)</CardTitle>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="psychologicalState"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Psychological State</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-popover z-50 shadow-md">
                                  <SelectValue placeholder="Select state" />
                                  </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="bg-popover z-50 shadow-md text-popover-foreground">
                                  <SelectItem value="Calm & Focused">Calm & Focused</SelectItem>
                                  <SelectItem value="Overconfident">Overconfident</SelectItem>
                                  <SelectItem value="Frustrated/Revenge Trading">Frustrated/Revenge Trading</SelectItem>
                                  <SelectItem value="Hesitant/Fearful">Hesitant/Fearful</SelectItem>
                                  <SelectItem value="Disciplined Execution">Disciplined Execution</SelectItem>
                                  <SelectItem value="Impulsive">Impulsive</SelectItem>
                                  </SelectContent>
                                  </Select>
                              <FormDescription>How did you feel before/during this trade?</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="preTradePlan"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pre-Trade Plan</FormLabel>
                              <FormControl>
                                <Textarea rows={2} placeholder="Describe your reasoning, setup, and risk parameters." {...field} />
                              </FormControl>
                              <FormDescription>Optional</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="postTradeReflection"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Post-Trade Reflection</FormLabel>
                              <FormControl>
                                <Textarea rows={2} placeholder="What went well? What could be improved? Adherence to plan?" {...field} />
                              </FormControl>
                              <FormDescription>Optional</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="customTags"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Custom Tags</FormLabel>
                              <FormControl>
                                {/* Tag Autocomplete Component */}
                                <TagAutocomplete value={field.value || []} onChange={field.onChange} />
                              </FormControl>
                              <FormDescription>e.g., Scalping, Breakout, FOMO</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea rows={3} placeholder="Add any notes about this trade..." {...field} />
                            </FormControl>
                            <FormDescription>Optional</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </Card>
              )}
              {assetType === "Options Contract" && (
                <Card className="p-6">
                  <CardTitle className="mb-4 text-lg">Options Contract Details</CardTitle>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="symbol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Underlying Symbol</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. TSLA" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Options Chain Lookup Button & Modal */}
                    {form.watch("symbol") && form.watch("expirationDate") && (
                      <OptionsChainLookup
                        symbol={form.watch("symbol")}
                        expiry={form.watch("expirationDate") || ""}
                        onSelectContract={(contract) => {
                          form.setValue("symbol", contract.symbol);
                          form.setValue("callPut", contract.type);
                          form.setValue("strikePrice", contract.strike);
                          form.setValue("expirationDate", contract.expiry);
                          form.setValue("positionSize", contract.contracts);
                          form.setValue("entry", contract.premium);
                        }}
                      />
                    )}
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trade Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tradeTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trade Time</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="HH:MM" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="direction"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Direction</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-popover z-50 shadow-md">
                                <SelectValue placeholder="Select direction" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-popover z-50 shadow-md text-popover-foreground">
                              <SelectItem value="Buy to Open">Buy to Open</SelectItem>
                              <SelectItem value="Sell to Open">Sell to Open</SelectItem>
                              <SelectItem value="Buy to Close">Buy to Close</SelectItem>
                              <SelectItem value="Sell to Close">Sell to Close</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="callPut"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Call/Put</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-popover z-50 shadow-md">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-popover z-50 shadow-md text-popover-foreground">
                              <SelectItem value="Call">Call</SelectItem>
                              <SelectItem value="Put">Put</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="strikePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Strike Price</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="expirationDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiration Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="positionSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Contracts</FormLabel>
                          <FormControl>
                            <Input type="number" step="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="entry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Premium per Contract (Entry Price)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {tradeStatus === "Closed" && (
                      <FormField
                        control={form.control}
                        name="exit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Exit Premium per Contract</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={form.control}
                      name="commissionFees"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commission/Fees</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormDescription>Optional</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="underlyingPriceAtEntry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Underlying Price at Entry</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormDescription>Optional</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="underlyingPriceAtExit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Underlying Price at Exit</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormDescription>Optional</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Card>
              )}
              {assetType === "Futures Contract" && (
                <Card className="p-6">
                  <CardTitle className="mb-4 text-lg">Futures Contract Details</CardTitle>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="contractSymbol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Futures Contract Symbol</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. ES=F" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trade Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tradeTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trade Time</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="HH:MM" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="direction"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Direction</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-popover z-50 shadow-md">
                                <SelectValue placeholder="Select direction" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-popover z-50 shadow-md text-popover-foreground">
                              <SelectItem value="Long">Long</SelectItem>
                              <SelectItem value="Short">Short</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="entry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Entry Price</FormLabel>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={async () => {
                                if (!watchedSymbol) return;
                                const res = await fetch(`/api/market/quote/${watchedSymbol}`);
                                if (res.ok) {
                                  const data = await res.json();
                                  form.setValue("entry", parseFloat(data["05. price"]));
                                }
                              }}
                            >
                              Fetch
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Contracts</FormLabel>
                          <FormControl>
                            <Input type="number" step="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {tradeStatus === "Closed" && (
                      <FormField
                        control={form.control}
                        name="exit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Exit Price</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={form.control}
                      name="commissionFees"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commission/Fees</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormDescription>Optional</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Card>
              )}
              {assetType === "Cryptocurrency" && (
                <Card className="p-6">
                  <CardTitle className="mb-4 text-lg">Cryptocurrency Details</CardTitle>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="cryptoPair"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Crypto Pair</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. BTC/USD" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trade Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tradeTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trade Time</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="HH:MM" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="direction"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Direction</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-popover z-50 shadow-md">
                                <SelectValue placeholder="Select direction" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-popover z-50 shadow-md text-popover-foreground">
                              <SelectItem value="Buy">Buy</SelectItem>
                              <SelectItem value="Sell">Sell</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="entry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Entry Price</FormLabel>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={async () => {
                                if (!watchedSymbol) return;
                                const res = await fetch(`/api/market/quote/${watchedSymbol}`);
                                if (res.ok) {
                                  const data = await res.json();
                                  form.setValue("entry", parseFloat(data["05. price"]));
                                }
                              }}
                            >
                              Fetch
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity (Coins/Tokens)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.0001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {tradeStatus === "Closed" && (
                      <FormField
                        control={form.control}
                        name="exit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Exit Price</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={form.control}
                      name="exchange"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exchange</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Binance, Coinbase" {...field} />
                          </FormControl>
                          <FormDescription>Optional</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="commissionFees"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fees</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormDescription>Optional</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Card>
              )}
            </div>

            {/* Pricing & Sizing Section */}
            <div className="mb-6">
              <Card className="p-6">
                <CardTitle className="mb-4 text-lg">Pricing & Sizing</CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-x-6 gap-y-4">
                  <FormField
                    control={form.control}
                    name="entry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entry Price</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormDescription>Price at entry</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {tradeStatus === "Closed" && (
                    <FormField
                      control={form.control}
                      name="exit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exit Price</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormDescription>Price at exit</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormField
                    control={form.control}
                    name="positionSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position Size</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormDescription>Number of shares/contracts</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>
            </div>

            {/* Risk Management Section */}
            <div className="mb-6">
              <Card className="p-6">
                <CardTitle className="mb-4 text-lg">Risk Management</CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-x-6 gap-y-4">
                  <FormField
                    control={form.control}
                    name="stopLoss"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stop Loss</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormDescription>Optional</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="takeProfit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Take Profit</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormDescription>Optional</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>
            </div>

            {/* Calculated Metrics Section */}
            {tradeStatus === "Closed" && (
              <div className="mb-6">
                <Card className="p-6">
                  <CardTitle className="mb-4 text-lg">Calculated Metrics</CardTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FormLabel>P&amp;L</FormLabel>
                      <div className={cn(
                        "mt-1 px-3 py-2 rounded-md border bg-background text-lg font-mono",
                        pnl !== "-" && (parseFloat(pnl) > 0 ? "text-success" : parseFloat(pnl) < 0 ? "text-destructive" : "")
                      )}>
                        {pnl !== "-" ? `${pnl}` : "-"}
                      </div>
                      <FormDescription>Calculated: (Exit - Entry) × Position Size</FormDescription>
                    </div>
                    <div>
                      <FormLabel>R:R</FormLabel>
                      <div className="mt-1 px-3 py-2 rounded-md border bg-background text-lg font-mono">
                        {rr !== "-" ? `${rr}:1` : "-"}
                      </div>
                      <FormDescription>Calculated: (Take Profit - Entry) / (Entry - Stop Loss)</FormDescription>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Documentation Section */}
            <div className="mb-6">
              <Card className="p-6">
                <CardTitle className="mb-4 text-lg">Documentation</CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="psychologicalState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Psychological State</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-popover z-50 shadow-md">
                            <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-popover z-50 shadow-md text-popover-foreground">
                            <SelectItem value="Calm & Focused">Calm & Focused</SelectItem>
                            <SelectItem value="Overconfident">Overconfident</SelectItem>
                            <SelectItem value="Frustrated/Revenge Trading">Frustrated/Revenge Trading</SelectItem>
                            <SelectItem value="Hesitant/Fearful">Hesitant/Fearful</SelectItem>
                            <SelectItem value="Disciplined Execution">Disciplined Execution</SelectItem>
                            <SelectItem value="Impulsive">Impulsive</SelectItem>
                            </SelectContent>
                            </Select>
                        <FormDescription>How did you feel before/during this trade?</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="preTradePlan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pre-Trade Plan</FormLabel>
                        <FormControl>
                          <Textarea rows={2} placeholder="Describe your reasoning, setup, and risk parameters." {...field} />
                        </FormControl>
                        <FormDescription>Optional</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="postTradeReflection"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Post-Trade Reflection</FormLabel>
                        <FormControl>
                          <Textarea rows={2} placeholder="What went well? What could be improved? Adherence to plan?" {...field} />
                        </FormControl>
                        <FormDescription>Optional</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customTags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Tags</FormLabel>
                        <FormControl>
                          {/* Tag Autocomplete Component */}
                          <TagAutocomplete value={field.value || []} onChange={field.onChange} />
                        </FormControl>
                        <FormDescription>e.g., Scalping, Breakout, FOMO</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="Add any notes about this trade..." {...field} />
                      </FormControl>
                      <FormDescription>Optional</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Card>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => router.push("/trades")}>Cancel</Button>
              <Button type="submit" variant="default">
                {isEditMode ? "Update Trade" : "Submit Trade"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      </Card>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50} minSize={30} maxSize={70} className="w-full md:w-[600px] md:ml-6 mt-6 md:mt-0">
        <TradingViewSidebar symbol={symbol} assetType={assetTypeValue} />
      </ResizablePanel>
    </Resizable>
  );
}
