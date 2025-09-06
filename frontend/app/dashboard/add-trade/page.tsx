'use client';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

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
import { z } from 'zod';
import { addTradeAction } from '@/app/actions/add-trade';

// ... existing code ...

type TradeFormValues = z.infer<typeof tradeSchema>;

const tradeSchema = z.discriminatedUnion('asset_type', [
  z.object({
    asset_type: z.literal('stock'),
    symbol: z.string().min(1, 'Symbol is required'),
    side: z.enum(['buy', 'sell']),
    quantity: z.coerce.number().positive('Quantity must be a positive number'),
    entry_price: z.coerce.number().positive('Price must be a positive number').nullable(),
    entry_date: z.string().min(1, 'Date and time are required'),
    account: z.string().optional(),
    fees: z.coerce.number().min(0).optional().nullable(),
    notes: z.string().optional(),
  }),
  z.object({
    asset_type: z.literal('option'),
    underlying: z.string().min(1, 'Underlying symbol is required'),
    optionType: z.enum(['call', 'put']),
    action: z.enum(['buy_to_open', 'sell_to_open', 'buy_to_close', 'sell_to_close']),
    contracts: z.coerce.number().int().positive('Contracts must be a positive integer').nullable(),
    strike: z.coerce.number().positive('Strike price must be a positive number').nullable(),
    expiration_date: z.string().min(1, 'Expiration date is required').nullable(),
    entry_price: z.coerce.number().positive('Price must be a positive number').nullable(),
    multiplier: z.coerce.number().int().positive('Multiplier must be a positive integer').nullable(),
    entry_date: z.string().min(1, 'Date and time are required'),
    account: z.string().optional(),
    fees: z.coerce.number().min(0).optional().nullable(),
    notes: z.string().optional(),
  }),
  z.object({
    asset_type: z.literal('futures'),
    symbol: z.string().min(1, 'Symbol is required'),
    contracts: z.coerce.number().int().positive('Contracts must be a positive integer').nullable(),
    expiration_date: z.string().min(1, 'Expiration is required').nullable(),
    entry_price: z.coerce.number().positive('Price must be a positive number').nullable(),
    multiplier: z.coerce.number().positive('Multiplier must be a positive number').nullable(),
    currency: z.string().optional(),
    entry_date: z.string().min(1, 'Date and time are required'),
    account: z.string().optional(),
    fees: z.coerce.number().min(0).optional().nullable(),
    notes: z.string().optional(),
  }),
  z.object({
    asset_type: z.literal('crypto'),
    symbol: z.string().min(1, 'Symbol is required'),
    quantity: z.coerce.number().positive('Quantity must be a positive number'),
    entry_price: z.coerce.number().positive('Price must be a positive number').nullable(),
    entry_date: z.string().min(1, 'Date and time are required'),
    account: z.string().optional(),
    fees: z.coerce.number().min(0).optional().nullable(),
    notes: z.string().optional(),
  }),
]);

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

  // Get appropriate default values based on asset type
  const getDefaultValues = (type: AssetType): Partial<TradeFormValues> => {
    const baseValues = {
      entry_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      fees: 0,
      account: '',
      notes: '',
    };

    switch (type) {
      case 'stock':
        return {
          asset_type: 'stock',
          symbol: '',
          side: 'buy',
          quantity: 1,
          entry_price: null,
          ...baseValues,
        };
      case 'option':
        return {
          asset_type: 'option',
          underlying: '',
          optionType: 'call',
          action: 'buy_to_open',
          contracts: null,
          strike: null,
          expiration_date: null,
          entry_price: null,
          multiplier: 100,
          ...baseValues,
        };
      case 'futures':
        return {
          asset_type: 'futures',
          symbol: '',
          contracts: null,
          expiration_date: null,
          entry_price: null,
          multiplier: null,
          currency: 'USD',
          ...baseValues,
        };
      case 'crypto':
        return {
          asset_type: 'crypto',
          symbol: '',
          quantity: 1,
          entry_price: null,
          ...baseValues,
        };
      default:
        return {
          asset_type: 'stock',
          symbol: '',
          side: 'buy',
          quantity: 1,
          entry_price: null,
          ...baseValues,
        };
    }
  };

  // Initialize form with dynamic schema
  const form = useForm<TradeFormValues>({
    resolver: zodResolver(tradeSchema),
    defaultValues: getDefaultValues(assetType),
    mode: 'onChange', // Enable real-time validation
  });

  // Handle asset type change
  const handleAssetTypeChange = (newType: AssetType) => {
    console.log('Changing asset type to:', newType);
    setAssetType(newType);
    
    // Get current entry_date to preserve it
    const currentEntryDate = form.getValues('entry_date') || format(new Date(), "yyyy-MM-dd'T'HH:mm");
    
    // Get new default values and preserve entry_date
    const newDefaults = getDefaultValues(newType);
    newDefaults.entry_date = currentEntryDate;
    
    console.log('New defaults:', newDefaults);
    form.reset(newDefaults);
  };

  // Calculate totals for display
  const calculateTotal = () => {
    const values = form.watch();
    const fees = values.fees || 0;

    switch (values.asset_type) {
      case 'stock':
      case 'crypto': {
        const quantity = 'quantity' in values ? values.quantity || 0 : 0;
        const price = values.entry_price || 0;
        return quantity * price + fees;
      }
      case 'option': {
        const contracts = 'contracts' in values ? values.contracts || 0 : 0;
        const multiplier = 'multiplier' in values ? values.multiplier || 100 : 100;
        const price = values.entry_price || 0;
        return contracts * multiplier * price + fees;
      }
      case 'futures': {
        const contracts = 'contracts' in values ? values.contracts || 0 : 0;
        const multiplier = 'multiplier' in values ? values.multiplier || 1 : 1;
        const price = values.entry_price || 0;
        return contracts * multiplier * price + fees;
      }
      default:
        return 0;
    }
  };

  // Handle form submission
  const onSubmit = async (data: TradeFormValues) => {
    setIsSubmitting(true);
    try {
      console.log('Form data:', data);
      
      // Map form data to server action input format based on asset type
      let serverData: any = {
        asset_type: data.asset_type,
        entry_date: data.entry_date,
        fees: data.fees || 0,
        notes: data.notes || '',
        account: data.account || '',
        entry_price: data.entry_price || 0,
        isClosed: false,
      };

      // Add asset-specific fields
      switch (data.asset_type) {
        case 'stock':
          serverData = {
            ...serverData,
            symbol: data.symbol,
            side: 'side' in data ? data.side : 'buy',
            quantity: 'quantity' in data ? data.quantity : 0,
          };
          break;
        case 'crypto':
          serverData = {
            ...serverData,
            symbol: data.symbol,
            side: 'side' in data ? data.side : 'buy',
            quantity: 'quantity' in data ? data.quantity : 0,
          };
          break;
        case 'option':
          serverData = {
            ...serverData,
            symbol: data.underlying, // Use underlying as symbol for options
            side: data.action?.includes('buy') ? 'buy' : 'sell', // Map action to side
            underlying: data.underlying,
            optionType: data.optionType,
            action: data.action,
            strike: data.strike || 0,
            expiration: data.expiration_date || '',
            multiplier: data.multiplier || 100,
            quantity: 'contracts' in data ? data.contracts || 0 : 0,
          };
          break;
        case 'futures':
          serverData = {
            ...serverData,
            symbol: data.symbol,
            side: 'buy', // Default to buy for futures (could be made configurable)
            contractCode: data.symbol,
            expiration: data.expiration_date || '',
            multiplier: data.multiplier || 1,
            tickSize: 0.01,
            tickValue: 0.01,
            pointMultiplier: data.multiplier || 1,
            quantity: 'contracts' in data ? data.contracts || 0 : 0,
          };
          break;
      }

      console.log('Server data:', serverData);
      const result = await addTradeAction(serverData);
      console.log('Server result:', result);

      if (!result.ok) {
        console.error('Server action failed:', result.errors);
        // Handle validation errors
        if (result.errors.fieldErrors) {
          Object.entries(result.errors.fieldErrors).forEach(([field, messages]) => {
            form.setError(field as any, { message: messages?.[0] || 'Invalid field' });
          });
        }
        if (result.errors.formErrors) {
          toast.error(result.errors.formErrors[0] || 'Failed to add trade');
        }
        return;
      }

      toast.success('Trade added successfully!');
      
      // Reset form with fresh defaults
      const newDefaults = getDefaultValues(assetType);
      // Preserve account if it was set
      if (data.account) {
        newDefaults.account = data.account;
      }
      form.reset(newDefaults);
    } catch (error: any) {
      console.error('Trade submission error:', error);
      toast.error('Could not add trade. Please try again.');
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

  try {
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
                  <TabsTrigger value="futures">Future</TabsTrigger>
                  <TabsTrigger value="crypto">Crypto</TabsTrigger>
                </TabsList>

                {/* Common Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  {/* Only show side field for stock and crypto */}
                  {(assetType === 'stock' || assetType === 'crypto') && (
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
                  )}

                  <FormField
                    control={form.control}
                    name="entry_date"
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
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="entry_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price per Share *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="150.00"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
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
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
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
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expiration_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiration Date *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="entry_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price per Contract *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="2.50"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
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
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
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
                <TabsContent value="futures" className="space-y-4">
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
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expiration_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiration (YYYY-MM) *</FormLabel>
                          <FormControl>
                            <Input
                              type="month"
                              {...field}
                              value={field.value || ''}
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
                      name="entry_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="4500.00"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
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
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
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
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="entry_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="50000.00"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
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
                          value={field.value || ''}
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
                         assetType === 'futures' ? 'Notional Value' : 
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
                  {assetType === 'futures' && (
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
  } catch (error) {
    console.error('Add trade page error:', error);
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add Trade</h1>
            <p className="text-muted-foreground">
              Record a new trade in your journal
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-red-600">Error Loading Form</h2>
              <p className="text-muted-foreground mt-2">
                There was an error loading the trade form. Please try refreshing the page.
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4"
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}
