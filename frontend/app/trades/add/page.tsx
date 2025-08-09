"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { addTradeAction } from "@/app/actions/add-trade"
import { FUTURES_SPECS, enforceTick, roundToTick, previewPnl } from "@/lib/trading"

export default function AddTradePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [tradeType, setTradeType] = useState<"stock" | "option" | "futures">("stock")
  const [formData, setFormData] = useState<any>({
    symbol: "",
    side: "buy",
    quantity: "1",
    entry_price: "",
    exit_price: "",
    entry_date: new Date(),
    exit_date: null as Date | null,
    isClosed: false,
    notes: "",
    // options
    optionType: "call",
    strike: "",
    expiration: "",
    multiplier: 100,
    // futures
    contractCode: "",
    tickSize: "",
    tickValue: "",
    pointMultiplier: "",
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const common = {
        symbol: String(formData.symbol).trim(),
        side: formData.side as "buy" | "sell",
        quantity: Number(formData.quantity),
        entry_price: Number(formData.entry_price),
        entry_date: formData.entry_date.toISOString(),
        isClosed: Boolean(formData.isClosed && formData.exit_price && formData.exit_date),
        exit_price: formData.exit_price ? Number(formData.exit_price) : undefined,
        exit_date: formData.exit_date ? formData.exit_date.toISOString() : undefined,
        notes: formData.notes || undefined,
      }

      let payload: any
      if (tradeType === "stock") {
        payload = { ...common, asset_type: "stock" as const }
      } else if (tradeType === "option") {
        payload = {
          ...common,
          asset_type: "option" as const,
          optionType: formData.optionType,
          strike: Number(formData.strike),
          expiration: new Date(formData.expiration || formData.entry_date).toISOString(),
          multiplier: Number(formData.multiplier) || 100,
        }
      } else {
        payload = {
          ...common,
          asset_type: "futures" as const,
          contractCode: formData.contractCode,
          tickSize: Number(formData.tickSize),
          tickValue: Number(formData.tickValue),
          pointMultiplier: Number(formData.pointMultiplier),
        }
        // tick enforcement for futures
        const entryOk = enforceTick(payload.entry_price, payload.tickSize)
        const exitOk = payload.isClosed && payload.exit_price ? enforceTick(payload.exit_price, payload.tickSize) : true
        if (!entryOk || !exitOk) {
          const which = !entryOk ? "Entry" : "Exit"
          const suggested = roundToTick(!entryOk ? payload.entry_price : payload.exit_price, payload.tickSize)
          toast.error(`${which} price must align to tick ${payload.tickSize}. Try ${suggested.toFixed(8)}`)
          setLoading(false)
          return
        }
      }

      const res = await addTradeAction(payload)
      if (!res.ok) {
        const err = (res.errors as any)
        const msg = err?.formErrors?.join("; ") || "Failed to add trade"
        toast.error(msg)
        setLoading(false)
        return
      }

      toast.success("Trade added successfully!")
      router.push("/trades")
    } catch (error) {
      console.error("Error:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Live P&L preview
  const pnlPreview = (() => {
    try {
      const input: any = {
        asset_type: tradeType,
        symbol: formData.symbol,
        side: formData.side,
        quantity: Number(formData.quantity),
        entry_price: Number(formData.entry_price),
        entry_date: formData.entry_date.toISOString(),
        isClosed: Boolean(formData.isClosed && formData.exit_price && formData.exit_date),
        exit_price: formData.exit_price ? Number(formData.exit_price) : undefined,
        exit_date: formData.exit_date ? formData.exit_date.toISOString() : undefined,
      }
      if (tradeType === "option") {
        input.optionType = formData.optionType
        input.strike = Number(formData.strike)
        input.expiration = new Date(formData.expiration || formData.entry_date).toISOString()
        input.multiplier = Number(formData.multiplier) || 100
      } else if (tradeType === "futures") {
        input.contractCode = formData.contractCode
        input.tickSize = Number(formData.tickSize)
        input.tickValue = Number(formData.tickValue)
        input.pointMultiplier = Number(formData.pointMultiplier)
      }
      const { realized } = previewPnl(input)
      return realized
    } catch {
      return 0
    }
  })()

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Add New Trade</h1>
        <p className="text-muted-foreground">Record a new trade in your journal</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Trade type */}
        <Tabs value={tradeType} onValueChange={(v) => setTradeType(v as any)}>
          <TabsList>
            <TabsTrigger value="stock">Stock</TabsTrigger>
            <TabsTrigger value="option">Options</TabsTrigger>
            <TabsTrigger value="futures">Futures</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trade Details */}
          <Card>
            <CardHeader>
              <CardTitle>Trade Details</CardTitle>
              <CardDescription>Basic information about your trade</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol *</Label>
                  <Input id="symbol" placeholder="AAPL" value={formData.symbol} onChange={(e) => handleInputChange("symbol", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="side">Action *</Label>
                  <Select value={formData.side} onValueChange={(value) => handleInputChange("side", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">{tradeType === "stock" ? "Shares" : tradeType === "option" ? "Contracts" : "Contracts"} *</Label>
                  <Input id="quantity" type="number" step="1" placeholder="1" value={formData.quantity} onChange={(e) => handleInputChange("quantity", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entry_price">Entry Price *</Label>
                  <Input id="entry_price" type="number" step="0.00000001" placeholder="150.00" value={formData.entry_price} onChange={(e) => handleInputChange("entry_price", e.target.value)} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exit_price">Exit Price</Label>
                  <Input id="exit_price" type="number" step="0.00000001" placeholder="155.00" value={formData.exit_price} onChange={(e) => handleInputChange("exit_price", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isClosed">Mark Closed</Label>
                  <Select value={formData.isClosed ? "yes" : "no"} onValueChange={(v) => handleInputChange("isClosed", v === "yes") }>
                    <SelectTrigger>
                      <SelectValue placeholder="Open/Closed" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">Open</SelectItem>
                      <SelectItem value="yes">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Entry Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.entry_date && "text-muted-foreground") }>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.entry_date ? format(formData.entry_date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={formData.entry_date} onSelect={(date) => handleInputChange("entry_date", date || new Date())} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Exit Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.exit_date && "text-muted-foreground") }>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.exit_date ? format(formData.exit_date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={formData.exit_date || undefined} onSelect={(date) => handleInputChange("exit_date", date || null)} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Type-specific */}
              {tradeType === "option" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Option Type</Label>
                    <Select value={formData.optionType} onValueChange={(v) => handleInputChange("optionType", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="call">Call</SelectItem>
                        <SelectItem value="put">Put</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Strike</Label>
                    <Input value={formData.strike} onChange={(e) => handleInputChange("strike", e.target.value)} type="number" step="0.01" />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiration</Label>
                    <Input value={formData.expiration} onChange={(e) => handleInputChange("expiration", e.target.value)} type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Multiplier</Label>
                    <Input value={formData.multiplier} onChange={(e) => handleInputChange("multiplier", Number(e.target.value))} type="number" step="1" />
                  </div>
                </div>
              )}

              {tradeType === "futures" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contract</Label>
                    <Select value={formData.contractCode} onValueChange={(v) => {
                      handleInputChange("contractCode", v)
                      const spec = (FUTURES_SPECS as any)[v]
                      if (spec) {
                        handleInputChange("tickSize", String(spec.tickSize))
                        handleInputChange("tickValue", String(spec.tickValue))
                        handleInputChange("pointMultiplier", String(spec.pointMultiplier))
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select contract" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(FUTURES_SPECS).map((k) => (
                          <SelectItem key={k} value={k}>{k}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tick Size</Label>
                    <Input value={formData.tickSize} onChange={(e) => handleInputChange("tickSize", e.target.value)} type="number" step="0.00000001" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tick Value</Label>
                    <Input value={formData.tickValue} onChange={(e) => handleInputChange("tickValue", e.target.value)} type="number" step="0.00000001" />
                  </div>
                  <div className="space-y-2">
                    <Label>Point Multiplier</Label>
                    <Input value={formData.pointMultiplier} onChange={(e) => handleInputChange("pointMultiplier", e.target.value)} type="number" step="0.00000001" />
                  </div>
                  {formData.contractCode && (
                    <div className="col-span-2 text-xs text-muted-foreground">
                      Tick: {formData.tickSize}, Tick Value: {formData.tickValue}, Point Multiplier: {formData.pointMultiplier}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>Optional details to enhance your trade record</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" placeholder="Add any additional notes about this trade..." value={formData.notes} onChange={(e) => handleInputChange("notes", e.target.value)} rows={4} />
              </div>
              {/* Live P&L Preview */}
              <div className="rounded-md border p-3 text-sm flex items-center justify-between">
                <div className="text-muted-foreground">P&L Preview</div>
                <div className={`font-semibold ${pnlPreview >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {pnlPreview >= 0 ? "+" : "-"}{new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(pnlPreview))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Adding Trade..." : "Add Trade"}
          </Button>
        </div>
      </form>
    </div>
  )
}
