'use client';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FUTURES_SPECS, enforceTick, roundToTick, previewPnl } from '@/lib/trading';
import { addTradeAction } from '@/app/actions/add-trade';

export default function AddTradePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [tradeType, setTradeType] = React.useState<'stock' | 'option' | 'futures'>('stock');

  const [formData, setFormData] = React.useState<any>({
    symbol: '',
    side: 'buy',
    quantity: '1',
    entry_price: '',
    exit_price: '',
    entry_date: new Date().toISOString().split('T')[0], // yyyy-mm-dd
    exit_date: '',
    isClosed: false,
    notes: '',
    // options
    optionType: 'call',
    strike: '',
    expiration: '',
    multiplier: 100,
    // futures
    contractCode: '',
    tickSize: '',
    tickValue: '',
    pointMultiplier: '',
  });

  const handleChange = (field: string, value: any) =>
    setFormData((p: any) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const common = {
        symbol: String(formData.symbol).trim(),
        side: formData.side as 'buy' | 'sell',
        quantity: Number(formData.quantity),
        entry_price: Number(formData.entry_price),
        entry_date: new Date(formData.entry_date || new Date()).toISOString(),
        isClosed: Boolean(formData.isClosed && formData.exit_price && formData.exit_date),
        exit_price: formData.exit_price ? Number(formData.exit_price) : undefined,
        exit_date: formData.exit_date ? new Date(formData.exit_date).toISOString() : undefined,
        notes: formData.notes || undefined,
      };

      let payload: any;
      if (tradeType === 'stock') {
        payload = { ...common, asset_type: 'stock' as const };
      } else if (tradeType === 'option') {
        payload = {
          ...common,
          asset_type: 'option' as const,
          optionType: formData.optionType,
          strike: Number(formData.strike),
          expiration: new Date(formData.expiration || formData.entry_date).toISOString(),
          multiplier: Number(formData.multiplier) || 100,
        };
      } else {
        payload = {
          ...common,
          asset_type: 'futures' as const,
          contractCode: formData.contractCode,
          tickSize: Number(formData.tickSize),
          tickValue: Number(formData.tickValue),
          pointMultiplier: Number(formData.pointMultiplier),
        };
        // Enforce tick grid
        const entryOk = enforceTick(payload.entry_price, payload.tickSize);
        const exitOk =
          payload.isClosed && payload.exit_price
            ? enforceTick(payload.exit_price, payload.tickSize)
            : true;
        if (!entryOk || !exitOk) {
          const which = !entryOk ? 'Entry' : 'Exit';
          const suggested = roundToTick(
            !entryOk ? payload.entry_price : payload.exit_price,
            payload.tickSize,
          );
          toast({
            title: `${which} price off tick`,
            description: `Align to tick ${payload.tickSize}. Try ${suggested.toFixed(8)}`,
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
      }

      const res = await addTradeAction(payload);
      if (!res.ok) {
        const err = res.errors as any;
        const msg = err?.formErrors?.join('; ') || 'Failed to add trade';
        toast({ title: 'Failed', description: msg, variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }

      toast({ title: 'Trade saved', variant: 'default' });
      router.push('/trades');
    } catch (e) {
      toast({ title: 'Unexpected error', description: String(e), variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const realizedPreview = (() => {
    try {
      const input: any = {
        asset_type: tradeType,
        symbol: formData.symbol,
        side: formData.side,
        quantity: Number(formData.quantity),
        entry_price: Number(formData.entry_price),
        entry_date: new Date(formData.entry_date || new Date()).toISOString(),
        isClosed: Boolean(formData.isClosed && formData.exit_price && formData.exit_date),
        exit_price: formData.exit_price ? Number(formData.exit_price) : undefined,
        exit_date: formData.exit_date ? new Date(formData.exit_date).toISOString() : undefined,
      };
      if (tradeType === 'option') {
        input.optionType = formData.optionType;
        input.strike = Number(formData.strike);
        input.expiration = new Date(formData.expiration || formData.entry_date).toISOString();
        input.multiplier = Number(formData.multiplier) || 100;
      } else if (tradeType === 'futures') {
        input.contractCode = formData.contractCode;
        input.tickSize = Number(formData.tickSize);
        input.tickValue = Number(formData.tickValue);
        input.pointMultiplier = Number(formData.pointMultiplier);
      }
      return previewPnl(input).realized;
    } catch {
      return 0;
    }
  })();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Add Trade</h2>
        <p className="text-muted-foreground">Record a new trading position</p>
      </div>

      <div className="max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Record New Trade</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter the details of your trade transaction
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Trade type selector */}
            <Tabs value={tradeType} onValueChange={(v) => setTradeType(v as any)}>
              <TabsList>
                <TabsTrigger value="stock">Stock</TabsTrigger>
                <TabsTrigger value="option">Options</TabsTrigger>
                <TabsTrigger value="futures">Futures</TabsTrigger>
              </TabsList>
            </Tabs>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input
                    id="symbol"
                    placeholder="e.g., AAPL"
                    value={formData.symbol}
                    onChange={(e) => handleChange('symbol', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="side">Side</Label>
                  <Select value={formData.side} onValueChange={(v) => handleChange('side', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select side" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="quantity">{tradeType === 'stock' ? 'Shares' : 'Contracts'}</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="1"
                    value={formData.quantity}
                    onChange={(e) => handleChange('quantity', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="entry_price">Entry Price</Label>
                  <Input
                    id="entry_price"
                    type="number"
                    step="0.00000001"
                    value={formData.entry_price}
                    onChange={(e) => handleChange('entry_price', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="exit_price">Exit Price</Label>
                  <Input
                    id="exit_price"
                    type="number"
                    step="0.00000001"
                    value={formData.exit_price}
                    onChange={(e) => handleChange('exit_price', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="isClosed">Status</Label>
                  <Select
                    value={formData.isClosed ? 'closed' : 'open'}
                    onValueChange={(v) => handleChange('isClosed', v === 'closed')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Open/Closed" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="entry_date">Entry Date</Label>
                  <Input
                    id="entry_date"
                    type="date"
                    value={formData.entry_date}
                    onChange={(e) => handleChange('entry_date', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="exit_date">Exit Date</Label>
                  <Input
                    id="exit_date"
                    type="date"
                    value={formData.exit_date}
                    onChange={(e) => handleChange('exit_date', e.target.value)}
                  />
                </div>
              </div>

              {/* Options fields */}
              {tradeType === 'option' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Option Type</Label>
                    <Select
                      value={formData.optionType}
                      onValueChange={(v) => handleChange('optionType', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="call">Call</SelectItem>
                        <SelectItem value="put">Put</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Strike</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.strike}
                      onChange={(e) => handleChange('strike', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Expiration</Label>
                    <Input
                      type="date"
                      value={formData.expiration}
                      onChange={(e) => handleChange('expiration', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Multiplier</Label>
                    <Input
                      type="number"
                      step="1"
                      value={formData.multiplier}
                      onChange={(e) => handleChange('multiplier', Number(e.target.value))}
                    />
                  </div>
                </div>
              )}

              {/* Futures fields */}
              {tradeType === 'futures' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Contract</Label>
                    <Select
                      value={formData.contractCode}
                      onValueChange={(v) => {
                        handleChange('contractCode', v);
                        const spec = (FUTURES_SPECS as any)[v];
                        if (spec) {
                          handleChange('tickSize', String(spec.tickSize));
                          handleChange('tickValue', String(spec.tickValue));
                          handleChange('pointMultiplier', String(spec.pointMultiplier));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select contract" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(FUTURES_SPECS).map((k) => (
                          <SelectItem key={k} value={k}>
                            {k}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tick Size</Label>
                    <Input
                      type="number"
                      step="0.00000001"
                      value={formData.tickSize}
                      onChange={(e) => handleChange('tickSize', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tick Value</Label>
                    <Input
                      type="number"
                      step="0.00000001"
                      value={formData.tickValue}
                      onChange={(e) => handleChange('tickValue', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Point Multiplier</Label>
                    <Input
                      type="number"
                      step="0.00000001"
                      value={formData.pointMultiplier}
                      onChange={(e) => handleChange('pointMultiplier', e.target.value)}
                    />
                  </div>
                  {formData.contractCode && (
                    <div className="col-span-2 text-xs text-muted-foreground">
                      Tick: {formData.tickSize}, Tick Value: {formData.tickValue}, Point Multiplier:{' '}
                      {formData.pointMultiplier}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this trade..."
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                />
              </div>

              {/* P&L preview */}
              <div className="rounded-md border p-3 text-sm flex items-center justify-between">
                <div className="text-muted-foreground">P&L Preview</div>
                <div
                  className={`font-semibold ${realizedPreview >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {realizedPreview >= 0 ? '+' : '-'}
                  {new Intl.NumberFormat('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(Math.abs(realizedPreview))}
                </div>
              </div>

              <div className="flex space-x-4">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Trade'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() =>
                    setFormData({
                      symbol: '',
                      side: 'buy',
                      quantity: '1',
                      entry_price: '',
                      exit_price: '',
                      entry_date: new Date().toISOString().split('T')[0],
                      exit_date: '',
                      isClosed: false,
                      notes: '',
                      optionType: 'call',
                      strike: '',
                      expiration: '',
                      multiplier: 100,
                      contractCode: '',
                      tickSize: '',
                      tickValue: '',
                      pointMultiplier: '',
                    })
                  }
                >
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
