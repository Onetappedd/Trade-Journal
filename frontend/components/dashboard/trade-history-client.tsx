'use client';

import { TradeTable } from '@/components/trades/TradeTable';
import { TradeStats } from '@/components/trades/TradeStats';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

export function TradeHistoryClient() {
  const [isUpdating, setIsUpdating] = useState(false);

  async function updateTradeStatuses() {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/update-trade-status', {
        method: 'POST',
      });

      const result = await res.json();

      if (res.ok) {
        toast(`Trade statuses updated – Updated ${result.updated} trades`);
        // Refresh the page to show updated statuses
        window.location.reload();
      } else {
        toast.error(`Failed to update statuses – ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error(`Failed to update statuses – ${String(error)}`);
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Trade History</h2>
          <p className="text-muted-foreground">View and manage your trading history</p>
        </div>
        <Button
          onClick={updateTradeStatuses}
          disabled={isUpdating}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
          {isUpdating ? 'Updating...' : 'Update Statuses'}
        </Button>
      </div>

      <TradeStats />
      <TradeTable />
    </div>
  );
}