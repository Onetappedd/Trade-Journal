"use client"

import type React from "react"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TagSelector } from "@/components/tag-selector"
import { useToast } from "@/hooks/use-toast"
import { TradeService } from "@/lib/api/trades"
import type { TradeFormData } from "@/lib/validations"

export default function AddTrade() {
  const [assetType, setAssetType] = useState("")
  const [symbol, setSymbol] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    broker: "",
    entryDate: "",
    exitDate: "",
    entryPrice: "",
    exitPrice: "",
    quantity: "",
    side: "",
    notes: "",
    // Option specific fields
    expiration: "",
    strike: "",
    optionType: "",
  })

  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepare trade data
      const tradeData: TradeFormData = {
        symbol,
        asset_type: assetType as any,
        broker: formData.broker as any,
        side: formData.side as any,
        quantity: Number.parseInt(formData.quantity),
        entry_price: Number.parseFloat(formData.entryPrice),
        exit_price: formData.exitPrice ? Number.parseFloat(formData.exitPrice) : undefined,
        entry_date: formData.entryDate,
        exit_date: formData.exitDate || undefined,
        notes: formData.notes,
        fees: 0,
        status: !formData.exitDate || !formData.exitPrice ? "open" : "closed",

        // Option specific fields
        strike_price: formData.strike ? Number.parseFloat(formData.strike) : undefined,
        expiration_date: formData.expiration || undefined,
        option_type: (formData.optionType as any) || undefined,

        // Tags (convert tag names to IDs - you'll need to implement tag selection)
        tag_ids: [], // TODO: Implement tag selection
      }

      const { data, error } = await TradeService.createTrade(tradeData)

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: `Trade ${tradeData.status === "open" ? "opened" : "added"} successfully!`,
        })

        // Reset form
        setSymbol("")
        setAssetType("")
        setTags([])
        setFormData({
          broker: "",
          entryDate: "",
          exitDate: "",
          entryPrice: "",
          exitPrice: "",
          quantity: "",
          side: "",
          notes: "",
          expiration: "",
          strike: "",
          optionType: "",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add trade. Please check your input.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="flex flex-col">
      <Navbar title="Add Trade" />

      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Add New Trade</CardTitle>
              <CardDescription>Record your trading activity for analysis and tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assetType">Asset Type</Label>
                    <Select value={assetType} onValueChange={setAssetType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select asset type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stock">Stock</SelectItem>
                        <SelectItem value="option">Option</SelectItem>
                        <SelectItem value="futures">Futures</SelectItem>
                        <SelectItem value="crypto">Crypto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="broker">Broker</Label>
                    <Select value={formData.broker} onValueChange={(value) => handleInputChange("broker", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select broker" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="webull">Webull</SelectItem>
                        <SelectItem value="robinhood">Robinhood</SelectItem>
                        <SelectItem value="schwab">Charles Schwab</SelectItem>
                        <SelectItem value="ibkr">Interactive Brokers</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input
                    id="symbol"
                    placeholder="e.g., AAPL, TSLA, SPY"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    required
                  />
                </div>

                {/* Conditional Option Fields */}
                {assetType === "option" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiration">Expiration</Label>
                      <Input
                        id="expiration"
                        type="date"
                        value={formData.expiration}
                        onChange={(e) => handleInputChange("expiration", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="strike">Strike Price</Label>
                      <Input
                        id="strike"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.strike}
                        onChange={(e) => handleInputChange("strike", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="optionType">Option Type</Label>
                      <Select
                        value={formData.optionType}
                        onValueChange={(value) => handleInputChange("optionType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Call/Put" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="call">Call</SelectItem>
                          <SelectItem value="put">Put</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="entryDate">Entry Date/Time</Label>
                    <Input
                      id="entryDate"
                      type="datetime-local"
                      value={formData.entryDate}
                      onChange={(e) => handleInputChange("entryDate", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exitDate">Exit Date/Time (Optional)</Label>
                    <Input
                      id="exitDate"
                      type="datetime-local"
                      value={formData.exitDate}
                      onChange={(e) => handleInputChange("exitDate", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="entryPrice">Entry Price</Label>
                    <Input
                      id="entryPrice"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.entryPrice}
                      onChange={(e) => handleInputChange("entryPrice", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exitPrice">Exit Price (Optional)</Label>
                    <Input
                      id="exitPrice"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.exitPrice}
                      onChange={(e) => handleInputChange("exitPrice", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="0"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange("quantity", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="side">Side</Label>
                  <Select value={formData.side} onValueChange={(value) => handleInputChange("side", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Buy or Sell" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tag Selector */}
                <TagSelector selectedTags={tags} onTagsChange={setTags} />

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes about this trade..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Adding Trade..." : "Add Trade"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* TradingView Chart Placeholder */}
          {symbol && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Chart - {symbol}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">TradingView chart for {symbol} would be embedded here</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
