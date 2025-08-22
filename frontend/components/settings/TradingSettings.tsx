'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth/auth-provider';
import { Trash2, AlertTriangle } from 'lucide-react';

export function TradingSettings() {
  const [autoStopLoss, setAutoStopLoss] = useState(false);
  const [confirmTrades, setConfirmTrades] = useState(true);
  const [riskTolerance, setRiskTolerance] = useState([5]);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  async function handleResetAllTrades() {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to reset trades',
        variant: 'destructive',
      });
      return;
    }

    setIsDeleting(true);
    try {
      const supabase = createClient();

      // Delete all trades for the current user
      const { error, count } = await supabase.from('trades').delete().eq('user_id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'All trades deleted',
        description: `Successfully deleted ${count || 'all'} trades from your account.`,
        variant: 'default',
      });

      // Refresh the page to update all components
      window.location.reload();
    } catch (error: any) {
      toast({
        title: 'Failed to delete trades',
        description: error.message || 'An error occurred while deleting trades',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Default Trading Preferences</CardTitle>
          <CardDescription>Set your default trading parameters and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default Asset Type</Label>
              <Select defaultValue="stocks">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stocks">Stocks</SelectItem>
                  <SelectItem value="etfs">ETFs</SelectItem>
                  <SelectItem value="options">Options</SelectItem>
                  <SelectItem value="crypto">Cryptocurrency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Order Type</Label>
              <Select defaultValue="market">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">Market Order</SelectItem>
                  <SelectItem value="limit">Limit Order</SelectItem>
                  <SelectItem value="stop">Stop Order</SelectItem>
                  <SelectItem value="stop-limit">Stop-Limit Order</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Default Position Size (%)</Label>
            <Input type="number" defaultValue="2" min="0.1" max="100" step="0.1" />
            <p className="text-sm text-muted-foreground">
              Percentage of portfolio to allocate per trade
            </p>
          </div>

          <Button>Save Preferences</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Risk Management</CardTitle>
          <CardDescription>Configure your risk management settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Risk Tolerance Level: {riskTolerance[0]}/10</Label>
              <Slider
                value={riskTolerance}
                onValueChange={setRiskTolerance}
                max={10}
                min={1}
                step={1}
                className="mt-2"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>Conservative</span>
                <span>Aggressive</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Stop-Loss</Label>
                <p className="text-sm text-muted-foreground">Automatically set stop-loss orders</p>
              </div>
              <Switch checked={autoStopLoss} onCheckedChange={setAutoStopLoss} />
            </div>

            {autoStopLoss && (
              <div className="space-y-2 ml-4">
                <Label>Default Stop-Loss (%)</Label>
                <Input type="number" defaultValue="5" min="1" max="50" />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Trade Confirmations</Label>
                <p className="text-sm text-muted-foreground">
                  Require confirmation before executing trades
                </p>
              </div>
              <Switch checked={confirmTrades} onCheckedChange={setConfirmTrades} />
            </div>
          </div>

          <Button>Save Risk Settings</Button>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Data Management
          </CardTitle>
          <CardDescription>Manage your trading data and history</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-900 mb-2">Danger Zone</h4>
              <p className="text-sm text-red-700 mb-4">
                This action cannot be undone. This will permanently delete all your trades,
                including all associated data, P&L calculations, and trading history.
              </p>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2" disabled={isDeleting}>
                    <Trash2 className="h-4 w-4" />
                    {isDeleting ? 'Deleting...' : 'Reset All Trades'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>
                        This action <strong>cannot be undone</strong>. This will permanently delete:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>All your trade records</li>
                        <li>All P&L calculations</li>
                        <li>All trading history</li>
                        <li>All position data</li>
                      </ul>
                      <p className="font-semibold text-red-600 pt-2">
                        Please type "DELETE ALL TRADES" to confirm:
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Input
                    id="confirm-delete"
                    placeholder="Type DELETE ALL TRADES to confirm"
                    className="mt-2"
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        const input = document.getElementById('confirm-delete') as HTMLInputElement;
                        if (input?.value === 'DELETE ALL TRADES') {
                          handleResetAllTrades();
                        } else {
                          e.preventDefault();
                          toast({
                            title: 'Confirmation required',
                            description: "Please type 'DELETE ALL TRADES' to confirm",
                            variant: 'destructive',
                          });
                        }
                      }}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete All Trades
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
