"use client"

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const tradeSchema = z.object({
  symbol: z.string().min(1, "Symbol is required"),
  side: z.enum(["buy", "sell"], { required_error: "Trade type is required" }),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  price: z.coerce.number().positive("Price must be positive"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
})

type TradeForm = z.infer<typeof tradeSchema>

function parseOptionSymbol(symbol: string) {
  const match = symbol.match(/^([A-Z]+)(\d{2})(\d{2})(\d{2})([PC])(\d{8})$/)
  if (!match) return null
  const [_, underlying, yy, mm, dd, type, strikeRaw] = match
  const year = Number(yy) < 50 ? "20" + yy : "19" + yy
  const expiry = `${year}-${mm}-${dd}`
  const strike = parseInt(strikeRaw, 10) / 1000
  return {
    underlying: underlying, // Extract the actual ticker (e.g., "ARM" from "ARM250703C00155000")
    expiry,
    option_type: type === "P" ? "put" : "call",
    strike_price: strike,
  }
}

export default function AddTradePage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  const form = useForm<TradeForm>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      symbol: "",
      side: "buy",
      quantity: 1,
      price: 0,
      date: new Date().toISOString().split('T')[0], // Today's date
      notes: "",
    },
  })

  async function onSubmit(data: TradeForm) {
    setIsSubmitting(true)
    try {
      const parsed = parseOptionSymbol(data.symbol)
      const trade = {
        symbol: data.symbol,
        side: data.side,
        quantity: Number(data.quantity),
        entry_price: Number(data.price),
        entry_date: new Date(data.date).toISOString(),
        asset_type: parsed ? "option" : "stock",
        broker: "Manual",
        notes: data.notes || null,
        ...(parsed ? parsed : {}),
      }

      const res = await fetch("/api/import-trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trades: [trade] }),
      })

      const result = await res.json()
      
      if (res.ok && result.success > 0) {
        toast({ title: "Trade saved successfully!", variant: "default" })
        form.reset()
      } else {
        // Show detailed error message
        const errorMsg = result.errors ? result.errors.join(", ") : result.error || "Unknown error"
        toast({ 
          title: "Failed to save trade", 
          description: errorMsg, 
          variant: "destructive" 
        })
        console.error("Trade save failed:", result)
      }
    } catch (e) {
      toast({ 
        title: "Failed to save trade", 
        description: String(e), 
        variant: "destructive" 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Add Trade</h2>
        <p className="text-muted-foreground">Record a new trading position</p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Record New Trade</CardTitle>
            <p className="text-sm text-muted-foreground">Enter the details of your trade transaction</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input 
                    id="symbol" 
                    placeholder="e.g., AAPL" 
                    {...form.register("symbol")}
                  />
                  {form.formState.errors.symbol && (
                    <span className="text-xs text-red-600">
                      {form.formState.errors.symbol.message}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="side">Trade Type</Label>
                  <Select 
                    value={form.watch("side")} 
                    onValueChange={(value) => form.setValue("side", value as "buy" | "sell")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.side && (
                    <span className="text-xs text-red-600">
                      {form.formState.errors.side.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input 
                    id="quantity" 
                    type="number" 
                    placeholder="100" 
                    {...form.register("quantity", { valueAsNumber: true })}
                  />
                  {form.formState.errors.quantity && (
                    <span className="text-xs text-red-600">
                      {form.formState.errors.quantity.message}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    step="0.01" 
                    placeholder="150.00" 
                    {...form.register("price", { valueAsNumber: true })}
                  />
                  {form.formState.errors.price && (
                    <span className="text-xs text-red-600">
                      {form.formState.errors.price.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input 
                  id="date" 
                  type="date" 
                  {...form.register("date")}
                />
                {form.formState.errors.date && (
                  <span className="text-xs text-red-600">
                    {form.formState.errors.date.message}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea 
                  id="notes" 
                  placeholder="Add any notes about this trade..." 
                  {...form.register("notes")}
                />
              </div>

              <div className="flex space-x-4">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Trade"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 bg-transparent"
                  onClick={() => form.reset()}
                >
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}