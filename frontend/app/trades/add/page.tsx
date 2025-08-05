"use client"

import type React from "react"

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
import { CalendarIcon, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"

export default function AddTradePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    symbol: "",
    side: "",
    quantity: "",
    entry_price: "",
    exit_price: "",
    entry_date: new Date(),
    exit_date: null as Date | null,
    asset_type: "",
    strategy: "",
    notes: "",
    fees: "",
    stop_loss: "",
    take_profit: "",
    risk_reward_ratio: "",
  })

  const handleInputChange = (field: string, value: string | Date | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) {
        toast.error("Please log in to add trades")
        return
      }

      // Calculate P&L if exit price is provided
      let pnl = null
      if (formData.exit_price && formData.side) {
        const quantity = Number.parseFloat(formData.quantity)
        const entryPrice = Number.parseFloat(formData.entry_price)
        const exitPrice = Number.parseFloat(formData.exit_price)
        const fees = Number.parseFloat(formData.fees) || 0

        if (formData.side === "buy") {
          pnl = (exitPrice - entryPrice) * quantity - fees
        } else {
          pnl = (entryPrice - exitPrice) * quantity - fees
        }
      }

      const tradeData = {
        user_id: user.id,
        symbol: formData.symbol.toUpperCase(),
        side: formData.side as "buy" | "sell",
        quantity: Number.parseFloat(formData.quantity),
        entry_price: Number.parseFloat(formData.entry_price),
        exit_price: formData.exit_price ? Number.parseFloat(formData.exit_price) : null,
        entry_date: formData.entry_date.toISOString().split("T")[0],
        exit_date: formData.exit_date ? formData.exit_date.toISOString().split("T")[0] : null,
        asset_type: formData.asset_type as "stock" | "option" | "crypto" | "forex",
        strategy: formData.strategy || null,
        notes: formData.notes || null,
        fees: formData.fees ? Number.parseFloat(formData.fees) : null,
        pnl,
      }

      const { error } = await supabase.from("trades").insert([tradeData])

      if (error) {
        console.error("Error adding trade:", error)
        toast.error("Failed to add trade")
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
                  <Input
                    id="symbol"
                    placeholder="AAPL"
                    value={formData.symbol}
                    onChange={(e) => handleInputChange("symbol", e.target.value)}
                    required
                  />
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
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    placeholder="100"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange("quantity", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entry_price">Entry Price *</Label>
                  <Input
                    id="entry_price"
                    type="number"
                    step="0.01"
                    placeholder="150.00"
                    value={formData.entry_price}
                    onChange={(e) => handleInputChange("entry_price", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exit_price">Exit Price</Label>
                  <Input
                    id="exit_price"
                    type="number"
                    step="0.01"
                    placeholder="155.00"
                    value={formData.exit_price}
                    onChange={(e) => handleInputChange("exit_price", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asset_type">Asset Type *</Label>
                  <Select
                    value={formData.asset_type}
                    onValueChange={(value) => handleInputChange("asset_type", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stock">Stock</SelectItem>
                      <SelectItem value="option">Option</SelectItem>
                      <SelectItem value="crypto">Crypto</SelectItem>
                      <SelectItem value="forex">Forex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Entry Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.entry_date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.entry_date ? format(formData.entry_date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.entry_date}
                        onSelect={(date) => handleInputChange("entry_date", date || new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Exit Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.exit_date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.exit_date ? format(formData.exit_date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.exit_date}
                        onSelect={(date) => handleInputChange("exit_date", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
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
                <Label htmlFor="strategy">Strategy</Label>
                <Select value={formData.strategy} onValueChange={(value) => handleInputChange("strategy", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day-trading">Day Trading</SelectItem>
                    <SelectItem value="swing-trading">Swing Trading</SelectItem>
                    <SelectItem value="scalping">Scalping</SelectItem>
                    <SelectItem value="momentum">Momentum</SelectItem>
                    <SelectItem value="breakout">Breakout</SelectItem>
                    <SelectItem value="reversal">Reversal</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fees">Fees</Label>
                  <Input
                    id="fees"
                    type="number"
                    step="0.01"
                    placeholder="5.00"
                    value={formData.fees}
                    onChange={(e) => handleInputChange("fees", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="risk_reward_ratio">Risk/Reward Ratio</Label>
                  <Input
                    id="risk_reward_ratio"
                    placeholder="1:2"
                    value={formData.risk_reward_ratio}
                    onChange={(e) => handleInputChange("risk_reward_ratio", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stop_loss">Stop Loss</Label>
                  <Input
                    id="stop_loss"
                    type="number"
                    step="0.01"
                    placeholder="145.00"
                    value={formData.stop_loss}
                    onChange={(e) => handleInputChange("stop_loss", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="take_profit">Take Profit</Label>
                  <Input
                    id="take_profit"
                    type="number"
                    step="0.01"
                    placeholder="160.00"
                    value={formData.take_profit}
                    onChange={(e) => handleInputChange("take_profit", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes about this trade..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows={4}
                />
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
