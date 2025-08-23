"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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

export function AddTradeFormClient() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [tradeType, setTradeType] = React.useState<'stock' | 'option' | 'futures'>('stock');
  const [formData, setFormData] = React.useState<any>({
    symbol: '', side: 'buy', quantity: '1', entry_price: '', exit_price: '', entry_date: new Date().toISOString().split('T')[0], exit_date: '', isClosed: false, notes: '',
    optionType: 'call', strike: '', expiration: '', multiplier: 100, contractCode: '', tickSize: '', tickValue: '', pointMultiplier: '',
  });
  const handleChange = (field: string, value: any) => setFormData((p: any) => ({ ...p, [field]: value }));
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const common = { symbol: String(formData.symbol).trim(), side: formData.side as 'buy' | 'sell', quantity: Number(formData.quantity), entry_price: Number(formData.entry_price), entry_date: new Date(formData.entry_date || new Date()).toISOString(), isClosed: Boolean(formData.isClosed && formData.exit_price && formData.exit_date), exit_price: formData.exit_price ? Number(formData.exit_price) : undefined, exit_date: formData.exit_date ? new Date(formData.exit_date).toISOString() : undefined, notes: formData.notes || undefined };
      let payload: any;
      if (tradeType === 'stock') {
        payload = { ...common, asset_type: 'stock' as const };
      } else if (tradeType === 'option') {
        payload = { ...common, asset_type: 'option' as const, optionType: formData.optionType, strike: Number(formData.strike), expiration: new Date(formData.expiration || formData.entry_date).toISOString(), multiplier: Number(formData.multiplier) || 100 };
      } else {
        payload = { ...common, asset_type: 'futures' as const, contractCode: formData.contractCode, tickSize: Number(formData.tickSize), tickValue: Number(formData.tickValue), pointMultiplier: Number(formData.pointMultiplier) };
        const entryOk = enforceTick(payload.entry_price, payload.tickSize);
        const exitOk = payload.isClosed && payload.exit_price ? enforceTick(payload.exit_price, payload.tickSize) : true;
        if (!entryOk || !exitOk) {
          const which = !entryOk ? 'Entry' : 'Exit';
          const suggested = roundToTick(!entryOk ? payload.entry_price : payload.exit_price, payload.tickSize);
          toast.error(`${which} price off tick`, { description: `Align to tick ${payload.tickSize}. Try ${suggested.toFixed(8)}` });
          setIsSubmitting(false); return;
        }
      }
      const res = await addTradeAction(payload);
      if (!res.ok) {
        const err = res.errors as any;
        const msg = err?.formErrors?.join('; ') || 'Failed to add trade';
        toast.error('Failed', { description: msg });
        setIsSubmitting(false); return;
      }
      toast.success('Trade saved');
      router.push('/trades');
    } catch (e) {
      toast.error('Unexpected error', { description: String(e) });
    } finally { setIsSubmitting(false); }
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
    } catch { return 0; }
  })();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Add Trade</h2>
        <p className="text-muted-foreground">Record a new trading position</p>
      </div>
      {/* ...same form JSX as before, update form event handlers to use the above handleSubmit, handleChange, etc. ... */}
    </div>
  );
}
