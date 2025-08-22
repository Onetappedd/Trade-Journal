'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function AddTradePage() {
  const [date, setDate] = useState<Date>();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Trade</h1>
          <p className="text-muted-foreground">Record a new trade in your journal</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Trade Details
          </CardTitle>
          <CardDescription>Enter the details of your trade below</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Input id="symbol" placeholder="e.g., AAPL, TSLA, SPY" className="uppercase" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Trade Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select trade type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="cover">Cover</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" placeholder="Number of shares" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input id="price" type="number" step="0.01" placeholder="Entry price" />
            </div>

            <div className="space-y-2">
              <Label>Trade Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="strategy">Strategy</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="swing">Swing Trading</SelectItem>
                  <SelectItem value="day">Day Trading</SelectItem>
                  <SelectItem value="scalp">Scalping</SelectItem>
                  <SelectItem value="position">Position Trading</SelectItem>
                  <SelectItem value="momentum">Momentum</SelectItem>
                  <SelectItem value="breakout">Breakout</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Trade Notes</Label>
            <Textarea
              id="notes"
              placeholder="Enter your trade rationale, setup, and any other notes..."
              className="min-h-[100px]"
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1">
              Add Trade
            </Button>
            <Button type="button" variant="outline">
              Save as Draft
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
