'use client';

import type React from 'react';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
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
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { z } from 'zod';

interface AddTradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FUTURES_SPECS: Record<
  string,
  { contractCode: string; pointMultiplier: number; tickSize: number; tickValue: number }
> = {
  ES: { contractCode: 'ES', pointMultiplier: 50, tickSize: 0.25, tickValue: 12.5 },
  MES: { contractCode: 'MES', pointMultiplier: 5, tickSize: 0.25, tickValue: 1.25 },
  NQ: { contractCode: 'NQ', pointMultiplier: 20, tickSize: 0.25, tickValue: 5 },
  MNQ: { contractCode: 'MNQ', pointMultiplier: 2, tickSize: 0.25, tickValue: 0.5 },
  YM: { contractCode: 'YM', pointMultiplier: 5, tickSize: 1, tickValue: 5 },
  MYM: { contractCode: 'MYM', pointMultiplier: 0.5, tickSize: 1, tickValue: 0.5 },
  CL: { contractCode: 'CL', pointMultiplier: 1000, tickSize: 0.01, tickValue: 10 },
  MCL: { contractCode: 'MCL', pointMultiplier: 100, tickSize: 0.01, tickValue: 1 },
  GC: { contractCode: 'GC', pointMultiplier: 100, tickSize: 0.1, tickValue: 10 },
  MGC: { contractCode: 'MGC', pointMultiplier: 10, tickSize: 0.1, tickValue: 1 },
};

export function AddTradeDialog({ open, onOpenChange }: AddTradeDialogProps) {
  const [formData, setFormData] = useState({
    symbol: '',
    assetType: '',
    side: '',
    quantity: '',
    entryPrice: '',
    exitPrice: '',
    entryDate: undefined as Date | undefined,
    exitDate: undefined as Date | undefined,
    contractCode: '',
    pointMultiplier: '',
    tickSize: '',
    tickValue: '',
    tags: '',
    notes: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  // zod schemas
  const baseTradeSchema = z.object({
    symbol: z.string().nonempty('Symbol is required'),
    assetType: z.enum(['stock', 'option', 'crypto', 'forex', 'futures']),
    side: z.enum(['buy', 'sell']),
    quantity: z.coerce.number().positive({ message: 'Quantity must be positive' }),
    entryPrice: z.coerce.number().positive({ message: 'Entry price must be positive' }),
    exitPrice: z.coerce.number().optional().or(z.literal('')),
    entryDate: z.instanceof(Date),
    exitDate: z.instanceof(Date).optional().or(z.literal(undefined)),
    tags: z.string().optional(),
    notes: z.string().optional(),
  });
  const futuresSchema = baseTradeSchema.extend({
    assetType: z.literal('futures'),
    contractCode: z.string().nonempty('Contract code required'),
    pointMultiplier: z.coerce.number().positive({ message: 'Point multiplier required' }),
    tickSize: z.coerce.number().positive({ message: 'Tick size required' }),
    tickValue: z.coerce.number().positive({ message: 'Tick value required' }),
  });
  const schema = formData.assetType === 'futures' ? futuresSchema : baseTradeSchema;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      schema.parse(formData);
    } catch (err: any) {
      setFormError(err.errors?.[0]?.message || 'Invalid input');
      return;
    }
    // Prepare payload for submission (for a real server: includes contractCode/pointMultiplier/etc)
    const payload = {
      symbol: formData.symbol,
      asset_type: formData.assetType,
      side: formData.side,
      quantity: Number(formData.quantity),
      entry_price: Number(formData.entryPrice),
      exit_price: formData.exitPrice ? Number(formData.exitPrice) : null,
      entry_date: formData.entryDate ? formData.entryDate.toISOString().split('T')[0] : null,
      exit_date: formData.exitDate ? formData.exitDate.toISOString().split('T')[0] : null,
      tags: formData.tags,
      notes: formData.notes,
      ...(formData.assetType === 'futures' && {
        contract_code: formData.contractCode,
        point_multiplier: Number(formData.pointMultiplier),
        tick_size: Number(formData.tickSize),
        tick_value: Number(formData.tickValue),
      }),
    };
    // Example: send payload to server
    console.log('Trade data to submit:', payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Trade</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                placeholder="AAPL"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assetType">Asset Type</Label>
              <Select
                value={formData.assetType}
                onValueChange={(value) => {
                  let newFields = { assetType: value };
                  if (value !== 'futures') {
                    newFields = {
                      ...newFields,
                      contractCode: '',
                      pointMultiplier: '',
                      tickSize: '',
                      tickValue: '',
                    };
                  }
                  setFormData({ ...formData, ...newFields });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select asset type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="option">Option</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="forex">Forex</SelectItem>
                  <SelectItem value="futures">Futures</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="side">Side</Label>
              <Select
                value={formData.side}
                onValueChange={(value) => setFormData({ ...formData, side: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Buy or Sell" />
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
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entryPrice">Entry Price</Label>
              <Input
                id="entryPrice"
                type="number"
                step="0.01"
                placeholder="150.25"
                value={formData.entryPrice}
                onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exitPrice">Exit Price (Optional)</Label>
              <Input
                id="exitPrice"
                type="number"
                step="0.01"
                placeholder="155.80"
                value={formData.exitPrice}
                onChange={(e) => setFormData({ ...formData, exitPrice: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Entry Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-transparent"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.entryDate ? format(formData.entryDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.entryDate}
                    onSelect={(date) => setFormData({ ...formData, entryDate: date })}
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
                    className="w-full justify-start text-left font-normal bg-transparent"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.exitDate ? format(formData.exitDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.exitDate}
                    onSelect={(date) => setFormData({ ...formData, exitDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {formData.assetType === 'futures' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contractCode">Contract Code</Label>
                <Select
                  value={formData.contractCode}
                  onValueChange={(code) => {
                    const spec = FUTURES_SPECS[code] || {
                      contractCode: code,
                      pointMultiplier: '',
                      tickSize: '',
                      tickValue: '',
                    };
                    setFormData({
                      ...formData,
                      contractCode: code,
                      pointMultiplier: String(spec.pointMultiplier || ''),
                      tickSize: String(spec.tickSize || ''),
                      tickValue: String(spec.tickValue || ''),
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select contract code" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(FUTURES_SPECS).map((code) => (
                      <SelectItem value={code} key={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pointMultiplier">Point Multiplier</Label>
                <Input
                  id="pointMultiplier"
                  type="number"
                  step="0.01"
                  placeholder="50, 5, etc."
                  value={formData.pointMultiplier}
                  onChange={(e) => setFormData({ ...formData, pointMultiplier: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tickSize">Tick Size</Label>
                <Input
                  id="tickSize"
                  type="number"
                  step="0.01"
                  placeholder="0.25, 0.01, etc."
                  value={formData.tickSize}
                  onChange={(e) => setFormData({ ...formData, tickSize: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tickValue">Tick Value</Label>
                <Input
                  id="tickValue"
                  type="number"
                  step="0.01"
                  placeholder="12.5, 1.25, 10, 1, etc."
                  value={formData.tickValue}
                  onChange={(e) => setFormData({ ...formData, tickValue: e.target.value })}
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              placeholder="Tech, Long-term, High-conviction"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Trade rationale, strategy, etc."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {formError && <div className="text-sm text-red-600 font-medium">{formError}</div>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Trade</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
