"use client";

import { useState, useEffect } from 'react';

export const dynamic = 'force-dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth/auth-provider';
import { DollarSign, Save, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PortfolioSettingsPage() {
  const { user } = useAuth();
    const [initialCapital, setInitialCapital] = useState<string>('10000');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    setIsLoading(true);
    const supabase = createClient();

    try {
      // First, try to get existing settings
      let { data: settings, error } = await supabase
        .from('user_settings')
        .select('initial_capital')
        .eq('user_id', user.id)
        .single();

      // If no settings exist, create default settings
      if (error && error.code === 'PGRST116') {
        const { data: newSettings, error: insertError } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            initial_capital: 10000,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating settings:', insertError);
          toast.error('Failed to create settings', { description: 'Error: Failed to create settings' });
        } else {
          settings = newSettings;
        }
      } else if (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings', { description: 'Error: Failed to load settings' });
      }

      if (settings) {
        setInitialCapital(settings.initial_capital?.toString() || '10000');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    const value = parseFloat(initialCapital);
    if (isNaN(value) || value < 0) {
      toast.error('Invalid Value', { description: 'Please enter a valid positive number' });
      return;
    }

    setIsSaving(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          initial_capital: value,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error saving settings:', error);
        toast.error('Failed to save settings', { description: 'Error: Failed to save settings' });
      } else {
        toast.success('Settings Saved – Your portfolio settings have been updated');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '$0.00';
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Portfolio Settings</h2>
        <p className="text-muted-foreground">
          Configure your portfolio preferences and initial capital
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Initial Capital
          </CardTitle>
          <CardDescription>
            Set your starting portfolio value. This is used to calculate your overall returns and
            performance metrics.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This value represents your starting capital and is used to calculate:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Total portfolio value (Initial Capital + Realized P&L)</li>
                <li>Overall return percentage</li>
                <li>Performance metrics and ratios</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="initial-capital">Initial Capital Amount</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="initial-capital"
                  type="number"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(e.target.value)}
                  placeholder="10000"
                  className="pl-8"
                  disabled={isLoading || isSaving}
                  step="0.01"
                  min="0"
                />
              </div>
              <Button onClick={handleSave} disabled={isLoading || isSaving} className="gap-2">
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Current value: {formatCurrency(initialCapital)}
            </p>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">How it works:</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Portfolio Value</strong> = Initial Capital + Total Realized P&L
              </p>
              <p>
                <strong>Return %</strong> = (Total P&L ÷ Initial Capital) × 100
              </p>
              <p className="text-xs">
                Note: Open positions are not included in portfolio value until they are closed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Portfolio Metrics</CardTitle>
          <CardDescription>Based on your current settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Initial Capital</p>
              <p className="text-2xl font-bold">{formatCurrency(initialCapital)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Currency</p>
              <p className="text-2xl font-bold">USD</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
