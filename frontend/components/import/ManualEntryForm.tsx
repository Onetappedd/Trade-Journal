'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ArrowLeft, Copy, Plus, ExternalLink, HelpCircle } from 'lucide-react';

// Form validation schema
const manualEntrySchema = z.object({
  instrument_type: z.enum(['equity', 'option', 'futures']),
  symbol: z.string().min(1, 'Symbol is required'),
  side: z.enum(['buy', 'sell', 'short', 'cover']),
  quantity: z.number().positive('Quantity must be positive'),
  price: z.number().positive('Price must be positive'),
  fees: z.number().min(0, 'Fees cannot be negative'),
  timestamp: z.string().min(1, 'Timestamp is required'),
  currency: z.string().min(1, 'Currency is required'),
  venue: z.string().min(1, 'Venue is required'),
  // Optional fields
  expiry: z.string().optional(),
  strike: z.number().optional(),
  option_type: z.enum(['call', 'put']).optional(),
  multiplier: z.number().optional(),
  underlying: z.string().optional(),
  order_id: z.string().optional(),
  exec_id: z.string().optional(),
}).refine((data) => {
  // Option-specific validation
  if (data.instrument_type === 'option') {
    if (!data.expiry) return false;
    if (!data.strike || data.strike <= 0) return false;
    if (!data.option_type) return false;
    if (!data.underlying) return false;
  }
  return true;
}, {
  message: 'Options require expiry, strike, option type, and underlying',
  path: ['expiry'], // This will show the error on the expiry field
});

type ManualEntryFormData = z.infer<typeof manualEntrySchema>;

interface LastEntry {
  instrument_type: 'equity' | 'option' | 'futures';
  symbol: string;
  side: 'buy' | 'sell' | 'short' | 'cover';
  quantity: number;
  price: number;
  fees: number;
  currency: string;
  venue: string;
  expiry?: string;
  strike?: number;
  option_type?: 'call' | 'put';
  multiplier?: number;
  underlying?: string;
}

export function ManualEntryForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastEntry, setLastEntry] = useState<LastEntry | null>(null);

  const form = useForm<ManualEntryFormData>({
    resolver: zodResolver(manualEntrySchema),
    defaultValues: {
      instrument_type: 'equity',
      side: 'buy',
      quantity: 0,
      price: 0,
      fees: 0,
      currency: 'USD',
      venue: 'NASDAQ',
      timestamp: new Date().toISOString().slice(0, 16), // Current datetime
    },
  });

  const instrumentType = form.watch('instrument_type');

  // Load last entry from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('lastManualEntry');
    if (saved) {
      try {
        setLastEntry(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse last entry:', error);
      }
    }
  }, []);

  const handleDuplicateLast = () => {
    if (lastEntry) {
      form.reset({
        ...lastEntry,
        timestamp: new Date().toISOString().slice(0, 16), // Keep current timestamp
      });
      toast.success('Last entry duplicated');
    } else {
      toast.error('No previous entry to duplicate');
    }
  };

  const onSubmit = async (data: ManualEntryFormData) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/import/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create manual entry');
      }

      const result = await response.json();
      
      // Save as last entry
      const entryToSave: LastEntry = {
        instrument_type: data.instrument_type,
        symbol: data.symbol,
        side: data.side,
        quantity: data.quantity,
        price: data.price,
        fees: data.fees,
        currency: data.currency,
        venue: data.venue,
        expiry: data.expiry,
        strike: data.strike,
        option_type: data.option_type,
        multiplier: data.multiplier,
        underlying: data.underlying,
      };
      localStorage.setItem('lastManualEntry', JSON.stringify(entryToSave));

      toast.success('Execution added successfully!', {
        action: {
          label: 'View Trades',
          onClick: () => router.push(`/dashboard/trades?symbol=${data.symbol}`),
        },
      });

      // Reset form with current timestamp
      form.reset({
        ...form.getValues(),
        timestamp: new Date().toISOString().slice(0, 16),
      });

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create manual entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Manual Entry</h1>
            <p className="text-muted-foreground">
              Add single executions manually for quick fixes or odd cases
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {lastEntry && (
            <Button variant="outline" size="sm" onClick={handleDuplicateLast}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate Last
            </Button>
          )}
          <Link href="/docs/importing">
            <Button variant="outline" size="sm">
              <HelpCircle className="h-4 w-4 mr-2" />
              Help
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Execution Details</CardTitle>
          <CardDescription>
            Enter the execution details. Required fields are marked with an asterisk (*).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Instrument Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instrument_type">Instrument Type *</Label>
                <Select
                  value={form.watch('instrument_type')}
                  onValueChange={(value) => form.setValue('instrument_type', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select instrument type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <SelectItem value="equity">Common Shares</SelectItem>
                    <SelectItem value="option">Options Contracts</SelectItem>
                    <SelectItem value="futures">Futures</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.instrument_type && (
                  <p className="text-sm text-red-600">{form.formState.errors.instrument_type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol *</Label>
                <Input
                  id="symbol"
                  placeholder="e.g., AAPL, SPY240216C00450000"
                  {...form.register('symbol')}
                />
                {form.formState.errors.symbol && (
                  <p className="text-sm text-red-600">{form.formState.errors.symbol.message}</p>
                )}
              </div>
            </div>

            {/* Side and Quantity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="side">Side *</Label>
                <Select
                  value={form.watch('side')}
                  onValueChange={(value) => form.setValue('side', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select side" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="cover">Cover</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.side && (
                  <p className="text-sm text-red-600">{form.formState.errors.side.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  placeholder="100"
                  {...form.register('quantity', { valueAsNumber: true })}
                />
                {form.formState.errors.quantity && (
                  <p className="text-sm text-red-600">{form.formState.errors.quantity.message}</p>
                )}
              </div>
            </div>

            {/* Price and Fees */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="150.25"
                  {...form.register('price', { valueAsNumber: true })}
                />
                {form.formState.errors.price && (
                  <p className="text-sm text-red-600">{form.formState.errors.price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fees">Fees *</Label>
                <Input
                  id="fees"
                  type="number"
                  step="0.01"
                  placeholder="1.00"
                  {...form.register('fees', { valueAsNumber: true })}
                />
                {form.formState.errors.fees && (
                  <p className="text-sm text-red-600">{form.formState.errors.fees.message}</p>
                )}
              </div>
            </div>

            {/* Timestamp and Currency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timestamp">Timestamp *</Label>
                <Input
                  id="timestamp"
                  type="datetime-local"
                  {...form.register('timestamp')}
                />
                {form.formState.errors.timestamp && (
                  <p className="text-sm text-red-600">{form.formState.errors.timestamp.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Select
                  value={form.watch('currency')}
                  onValueChange={(value) => form.setValue('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.currency && (
                  <p className="text-sm text-red-600">{form.formState.errors.currency.message}</p>
                )}
              </div>
            </div>

            {/* Venue and Order ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="venue">Venue *</Label>
                <Input
                  id="venue"
                  placeholder="NASDAQ, ARCA, CME"
                  {...form.register('venue')}
                />
                <p className="text-xs text-muted-foreground">
                  The exchange or trading venue where the execution occurred (e.g., NASDAQ, NYSE, ARCA, CME)
                </p>
                {form.formState.errors.venue && (
                  <p className="text-sm text-red-600">{form.formState.errors.venue.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="order_id">Order ID (Optional)</Label>
                <Input
                  id="order_id"
                  placeholder="ORD001"
                  {...form.register('order_id')}
                />
              </div>
            </div>

            {/* Execution ID */}
            <div className="space-y-2">
              <Label htmlFor="exec_id">Execution ID (Optional)</Label>
              <Input
                id="exec_id"
                placeholder="EXEC001"
                {...form.register('exec_id')}
              />
            </div>

            {/* Option-specific fields */}
            {instrumentType === 'option' && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold">Option Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry *</Label>
                    <Input
                      id="expiry"
                      type="date"
                      {...form.register('expiry')}
                    />
                    {form.formState.errors.expiry && (
                      <p className="text-sm text-red-600">{form.formState.errors.expiry.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="strike">Strike Price *</Label>
                    <Input
                      id="strike"
                      type="number"
                      step="0.01"
                      placeholder="450.00"
                      {...form.register('strike', { valueAsNumber: true })}
                    />
                    {form.formState.errors.strike && (
                      <p className="text-sm text-red-600">{form.formState.errors.strike.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="option_type">Option Type *</Label>
                    <Select
                      value={form.watch('option_type')}
                      onValueChange={(value) => form.setValue('option_type', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select option type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                        <SelectItem value="call">Call</SelectItem>
                        <SelectItem value="put">Put</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.option_type && (
                      <p className="text-sm text-red-600">{form.formState.errors.option_type.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="underlying">Underlying *</Label>
                    <Input
                      id="underlying"
                      placeholder="SPY"
                      {...form.register('underlying')}
                    />
                    {form.formState.errors.underlying && (
                      <p className="text-sm text-red-600">{form.formState.errors.underlying.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="multiplier">Multiplier (Optional)</Label>
                    <Input
                      id="multiplier"
                      type="number"
                      step="1"
                      placeholder="100"
                      {...form.register('multiplier', { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Execution
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
