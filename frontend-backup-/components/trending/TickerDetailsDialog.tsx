'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/format';
import { TrendingUp, TrendingDown, Minus, Star } from 'lucide-react';

export interface Ticker {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  volume: number;
  marketCap: number;
}

interface TickerDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticker: Ticker | null;
}

export function TickerDetailsDialog({ open, onOpenChange, ticker }: TickerDetailsDialogProps) {
  if (!ticker) return null;

  const handleAddToWatchlist = () => {
    const watchlistKey = 'watchlist:v1';
    const existingWatchlist = JSON.parse(localStorage.getItem(watchlistKey) || '[]') as string[];
    
    if (!existingWatchlist.includes(ticker.symbol)) {
      existingWatchlist.push(ticker.symbol);
      localStorage.setItem(watchlistKey, JSON.stringify(existingWatchlist));
      toast.success(`${ticker.symbol} added to watchlist`);
    } else {
      toast.info(`${ticker.symbol} is already in your watchlist`);
    }
  };

  const getTrendIcon = () => {
    if (ticker.changePct > 0) return <TrendingUp className="h-4 w-4" />;
    if (ticker.changePct < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getChangeColor = () => {
    if (ticker.changePct > 0) return 'text-green-600';
    if (ticker.changePct < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center justify-between">
            <span className="text-2xl font-bold">{ticker.symbol}</span>
            <Badge variant="outline" className="ml-2">
              Stock
            </Badge>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {ticker.name}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="text-2xl font-bold">{formatCurrency(ticker.price)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Change</p>
              <div className={`flex items-center gap-1 text-lg font-semibold ${getChangeColor()}`}>
                {getTrendIcon()}
                <span>{formatPercent(ticker.changePct)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Volume</p>
              <p className="text-lg font-medium">{formatNumber(ticker.volume)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Market Cap</p>
              <p className="text-lg font-medium">{formatCurrency(ticker.marketCap)}</p>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
          <Button onClick={handleAddToWatchlist} className="gap-2">
            <Star className="h-4 w-4" />
            Add to Watchlist
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}