"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, X, Plus } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth/enhanced-auth-provider"
import { supabase } from "@/lib/supabase"

const tradeSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").toUpperCase(),
  asset_type: z.enum(["stock", "option", "crypto", "forex"]),
  trade_type: z.enum(["buy", "sell"]),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  entry_price: z.number().min(0.01, "Entry price must be greater than 0"),
  exit_price: z.number().optional(),
  trade_date: z.date(),
  exit_date: z.date().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  // Option-specific fields
  strike_price: z.number().optional(),
  expiry_date: z.date().optional(),
  option_type: z.enum(["call", "put"]).optional(),
})

type TradeFormData = z.infer<typeof tradeSchema>

export default function AddTradePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newTag, setNewTag] = useState("")
  const [tags, setTags] = useState<string[]>([])

  const form = useForm<TradeFormData>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      trade_date: new Date(),
      asset_type: "stock",
      trade_type: "buy",
      tags: [],
    },
  })

  const watchAssetType = form.watch("asset_type")

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()]
      setTags(updatedTags)
      form.setValue("tags", updatedTags)
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((tag) => tag !== tagToRemove)
    setTags(updatedTags)
    form.setValue("tags", updatedTags)
  }

  const onSubmit = async (data: TradeFormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add trades",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Calculate profit/loss if exit price is provided
      let profitLoss = null
      if (data.exit_price) {
        const multiplier = data.trade_type === "buy" ? 1 : -1
        profitLoss = (data.exit_price - data.entry_price) * data.quantity * multiplier
      }

      const tradeData = {
        user_id: user.id,
        symbol: data.symbol,
        asset_type: data.asset_type,
        trade_type: data.trade_type,
        quantity: data.quantity,
        entry_price: data.entry_price,
        exit_price: data.exit_price || null,
        profit_loss: profitLoss,
        trade_date: data.trade_date.toISOString().split("T")[0],
        exit_date: data.exit_date ? data.exit_date.toISOString().split("T")[0] : null,
        notes: data.notes || null,
        tags: data.tags || [],
        strike_price: data.strike_price || null,
        expiry_date: data.expiry_date ? data.expiry_date.toISOString().split("T")[0] : null,
        option_type: data.option_type || null,
        status: data.exit_price ? "closed" : "open",
      }

      const { error } = await supabase.from("trades").insert([tradeData])

      if (error) {
        throw error
      }

      toast({
        title: "Success",
        description: "Trade added successfully",
      })

      router.push("/")
    } catch (error: any) {
      console.error("Error adding trade:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add trade",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Trade</h1>
          <p className="text-muted-foreground">Record a new trade in your journal</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Trade Details</CardTitle>
            <CardDescription>Enter the details of your trade</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Trade Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input id="symbol" placeholder="AAPL" {...form.register("symbol")} />
                  {form.formState.errors.symbol && (
                    <p className="text-sm text-destructive">{form.formState.errors.symbol.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="asset_type">Asset Type</Label>
                  <Select
                    value={form.watch("asset_type")}
                    onValueChange={(value) => form.setValue("asset_type", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select asset type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stock">Stock</SelectItem>
                      <SelectItem value="option">Option</SelectItem>
                      <SelectItem value="crypto">Crypto</SelectItem>
                      <SelectItem value="forex">Forex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trade_type">Trade Type</Label>
                  <Select
                    value={form.watch("trade_type")}
                    onValueChange={(value) => form.setValue("trade_type", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select trade type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="100"
                    {...form.register("quantity", { valueAsNumber: true })}
                  />
                  {form.formState.errors.quantity && (
                    <p className="text-sm text-destructive">{form.formState.errors.quantity.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entry_price">Entry Price</Label>
                  <Input
                    id="entry_price"
                    type="number"
                    step="0.01"
                    placeholder="150.00"
                    {...form.register("entry_price", { valueAsNumber: true })}
                  />
                  {form.formState.errors.entry_price && (
                    <p className="text-sm text-destructive">{form.formState.errors.entry_price.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exit_price">Exit Price (Optional)</Label>
                  <Input
                    id="exit_price"
                    type="number"
                    step="0.01"
                    placeholder="155.00"
                    {...form.register("exit_price", { valueAsNumber: true })}
                  />
                </div>
              </div>

              {/* Option-specific fields */}
              {watchAssetType === "option" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Option Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="strike_price">Strike Price</Label>
                      <Input
                        id="strike_price"
                        type="number"
                        step="0.01"
                        placeholder="150.00"
                        {...form.register("strike_price", { valueAsNumber: true })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="option_type">Option Type</Label>
                      <Select
                        value={form.watch("option_type") || ""}
                        onValueChange={(value) => form.setValue("option_type", value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select option type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="call">Call</SelectItem>
                          <SelectItem value="put">Put</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Expiry Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !form.watch("expiry_date") && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {form.watch("expiry_date") ? (
                              format(form.watch("expiry_date")!, "PPP")
                            ) : (
                              <span>Pick expiry date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={form.watch("expiry_date")}
                            onSelect={(date) => form.setValue("expiry_date", date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Trade Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.watch("trade_date") && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch("trade_date") ? (
                          format(form.watch("trade_date"), "PPP")
                        ) : (
                          <span>Pick trade date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch("trade_date")}
                        onSelect={(date) => form.setValue("trade_date", date || new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Exit Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.watch("exit_date") && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch("exit_date") ? format(form.watch("exit_date"), "PPP") : <span>Pick exit date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch("exit_date")}
                        onSelect={(date) => form.setValue("exit_date", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                  />
                  <Button type="button" onClick={addTag} size="icon" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea id="notes" placeholder="Add any notes about this trade..." {...form.register("notes")} />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding Trade..." : "Add Trade"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push("/")}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
