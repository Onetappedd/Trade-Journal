'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';
import { toSym } from '@/lib/symbol';
import { fetchJson } from '@/lib/fetchJson';
import { AssetType, TradeRow } from '@/types/trade';
import { Calculator, TrendingUp, AlertCircle } from 'lucide-react';

export const dynamic = "force-dynamic";
// Default multipliers for common futures
const FUTURE_MULTIPLIERS: Record<string, number> = {
  ES: 50,     // E-mini S&P 500
  NQ: 20,     // E-mini Nasdaq
  YM: 5,      // E-mini Dow
  RTY: 50,    // E-mini Russell
  CL: 1000,   // Crude Oil
  GC: 100,    // Gold
  SI: 5000,   // Silver
  ZB: 1000,   // 30-Year Bond
  ZN: 1000,   // 10-Year Note
  ZC: 50,     // Corn
  ZS: 50,     // Soybeans
  ZW: 50,     // Wheat
};

export default function AddTradePage() {
  const router = useRouter();
  const [assetType, setAssetType] = useState<AssetType>('stock');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the appropriate schema based on asset type
  const getSchema = () => {
    switch (assetType) {
      case 'stock':
        return stockTradeSchema;
      case 'option':
        return optionTradeSchema;
      case 'future':
        return futureTradeSchema;
      case 'crypto':
        return cryptoTradeSchema;
    }
  };

  // Initialize form with dynamic schema
  const form = useForm<TradeRow>({
    resolver: zodResolver(getSchema()),
    defaultValues: {
      assetType,
      side: 'buy',
      datetime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      fees: 0,
      account: '',
      notes: '',
      // Type-specific defaults
      ...(assetType === 'option' && { multiplier: 100 }),
      ...(assetType === 'future' && { currency: 'USD' }),
    },
  });

  // Handle asset type change
  const handleAssetTypeChange = (newType: AssetType) => {
    setAssetType(newType);
    form.reset({
      assetType: newType,
      side: form.getValues('side'),
      datetime: form.getValues('datetime'),
      fees: 0,
      account: '',
      notes: '',
      ...(newType === 'option' && { multiplier: 100 }),
      ...(newType === 'future' && { currency: 'USD' }),
    });
  };

  // Calculate totals for display
  const calculateTotal = () => {
    const values = form.watch();
    const fees = values.fees || 0;

    switch (assetType) {
      case 'stock':
      case 'crypto': {
        const quantity = values.quantity || 0;
        const price = values.price || 0;
        return quantity * price + fees;
      }
      case 'option': {
        const contracts = values.contracts || 0;
        const multiplier = values.multiplier || 100;
        const price = values.price || 0;
        return contracts * multiplier * price + fees;
      }
      case 'future': {
        const contracts = values.contracts || 0;
        const multiplier = values.multiplier || 1;
        const price = values.price || 0;
        return contracts * multiplier * price;
      }
      default:
        return 0;
    }
  };

  // Handle form submission
  const onSubmit = async (data: TradeRow) => {
    setIsSubmitting(true);
    try {
      const response = await fetchJson('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      toast.success('Trade added successfully!');
      
      // Reset form but keep common fields
      form.reset({
        assetType,
        side: data.side,
        datetime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        fees: 0,
        account: data.account,
        notes: '',
        ...(assetType === 'option' && { multiplier: 100 }),
        ...(assetType === 'future' && { currency: 'USD' }),
      });
    } catch (error: any) {
      console.error('Trade submission error:', error);
      
      if (error.issues) {
        // Show field-specific errors
        error.issues.forEach((issue: any) => {
          form.setError(issue.path as any, { message: issue.message });
        });
        toast.error('Please check the form for errors');
      } else {
        toast.error('Could not add trade. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-set future multiplier based on symbol
  const handleFutureSymbolBlur = (value: string) => {
    const symbol = toSym(value);
    if (FUTURE_MULTIPLIERS[symbol]) {
      form.setValue('multiplier', FUTURE_MULTIPLIERS[symbol]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Trade</h1>
          <p className="text-muted-foreground">
            Record a new trade in your journal
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/trades')}
        >
          View Trades
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trade Details</CardTitle>
          <CardDescription>
            Enter the details of your trade. All fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Asset Type Tabs */}
              <Tabs value={assetType} onValueChange={(v) => handleAssetTypeChange(v as AssetType)}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="stock">Stock</TabsTrigger>
                  <TabsTrigger value="option">Option</TabsTrigger>
                  <TabsTrigger value="future">Future</TabsTrigger>
                  <TabsTrigger value="crypto">Crypto</TabsTrigger>
                </TabsList>

                {/* Common Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <FormField
                    control={form.control}
                    name="side"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Side *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select side" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="buy">Buy</SelectItem>
                            <SelectItem value="sell">Sell</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="datetime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date & Time *</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="account"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., IRA, Margin" {...field} />
                        </FormControl>
                        <FormDescription>Optional account identifier</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="my-6" />

                {/* Stock Fields */}
                <TabsContent value="stock" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="symbol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Symbol *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., AAPL"
                              {...field}
                              onBlur={(e) => {
                                field.onChange(toSym(e.target.value));
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity (Shares) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.001"
                              placeholder="100"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price per Share *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="150.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Option Fields */}
                <TabsContent value="option" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="underlying"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Underlying Symbol *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., SPY"
                              {...field}
                              onBlur={(e) => {
                                field.onChange(toSym(e.target.value));
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="optionType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Option Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="call">Call</SelectItem>
                              <SelectItem value="put">Put</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="action"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Action *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select action" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="buy_to_open">Buy to Open</SelectItem>
                              <SelectItem value="sell_to_open">Sell to Open</SelectItem>
                              <SelectItem value="buy_to_close">Buy to Close</SelectItem>
                              <SelectItem value="sell_to_close">Sell to Close</SelectItem>
                            </SelectContent>
                          </Select>
                          {field.value?.includes('close') && (
                            <FormDescription className="flex items-center gap-1 text-amber-600">
                              <AlertCircle className="h-3 w-3" />
                              Closing trades should have a matching open position
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="contracts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contracts *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="1"
                              placeholder="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="strike"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Strike Price *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="150.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expiration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiration Date *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price per Contract *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="2.50"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="multiplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Multiplier</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Standard is 100 for most equity options
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Future Fields */}
                <TabsContent value="future" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="symbol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Symbol *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., ES, NQ, CL"
                              {...field}
                              onBlur={(e) => {
                                const symbol = toSym(e.target.value);
                                field.onChange(symbol);
                                handleFutureSymbolBlur(symbol);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Common symbols auto-set multiplier
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contracts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contracts *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="1"
                              placeholder="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expiration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiration (YYYY-MM) *</FormLabel>
                          <FormControl>
                            <Input
                              type="month"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="4500.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="multiplier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Multiplier *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="50"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Contract multiplier (e.g., ES = 50)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <FormControl>
                            <Input placeholder="USD" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Crypto Fields */}
                <TabsContent value="crypto" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="symbol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Symbol *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., BTCUSD, ETHUSD"
                              {...field}
                              onBlur={(e) => {
                                field.onChange(toSym(e.target.value));
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.00000001"
                              placeholder="0.5"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="50000.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <Separator />

              {/* Common Fields - Fees and Notes */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="fees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fees & Commissions</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Total fees including commissions, exchange fees, etc.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any notes about this trade..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional notes about your trade setup, reasoning, etc.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Total Calculation Display */}
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {assetType === 'option' ? 'Total Premium' : 
                         assetType === 'future' ? 'Notional Value' : 
                         'Total Cost'}
                      </span>
                    </div>
                    <span className="text-2xl font-bold">
                      {formatCurrency(calculateTotal())}
                    </span>
                  </div>
                  {assetType === 'option' && (
                    <p className="text-xs text-muted-foreground mt-2">
                      = contracts × multiplier × price + fees
                    </p>
                  )}
                  {assetType === 'future' && (
                    <p className="text-xs text-muted-foreground mt-2">
                      = contracts × multiplier × price (fees not included in notional)
                    </p>
                  )}
                  {(assetType === 'stock' || assetType === 'crypto') && (
                    <p className="text-xs text-muted-foreground mt-2">
                      = quantity × price + fees
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Submit Buttons */}
              <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? 'Adding Trade...' : 'Add Trade'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/trades')}
                >
                  View Trades
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}