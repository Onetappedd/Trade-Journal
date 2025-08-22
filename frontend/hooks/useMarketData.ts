'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: string;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
}

export interface TrendingStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: string;
  sector: string;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return response.json();
};

const batchFetcher = async (url: string, symbols: string[]) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ symbols }),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch batch data');
  }
  return response.json();
};

// Hook for single stock quote
export function useStockQuote(symbol: string, refreshInterval: number = 15000) {
  const { data, error, isLoading, mutate } = useSWR<StockQuote>(
    symbol ? `/api/market/quote/${symbol}` : null,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    },
  );

  return {
    quote: data,
    isLoading,
    error,
    refresh: mutate,
  };
}

// Hook for multiple stock quotes
export function useBatchQuotes(symbols: string[], refreshInterval: number = 15000) {
  const { data, error, isLoading, mutate } = useSWR<StockQuote[]>(
    symbols.length > 0 ? ['/api/market/batch-quotes', symbols] : null,
    ([url, syms]) => batchFetcher(url, syms),
    {
      refreshInterval,
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    },
  );

  return {
    quotes: data || [],
    isLoading,
    error,
    refresh: mutate,
  };
}

// Hook for trending stocks
export function useTrendingStocks(refreshInterval: number = 60000) {
  const { data, error, isLoading, mutate } = useSWR<TrendingStock[]>(
    '/api/market/trending',
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: true,
      dedupingInterval: 30000,
    },
  );

  return {
    trending: data || [],
    isLoading,
    error,
    refresh: mutate,
  };
}

// Hook for stock search
export function useStockSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ symbol: string; name: string; type: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 1) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/market/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(query);
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [query, search]);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    search,
  };
}

// Hook for watchlist with real-time prices
export function useWatchlist(symbols: string[], refreshInterval: number = 15000) {
  const { quotes, isLoading, error, refresh } = useBatchQuotes(symbols, refreshInterval);

  const [watchlist, setWatchlist] = useState<string[]>(symbols);

  const addToWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) => {
      if (!prev.includes(symbol)) {
        return [...prev, symbol];
      }
      return prev;
    });
  }, []);

  const removeFromWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) => prev.filter((s) => s !== symbol));
  }, []);

  const toggleWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) => {
      if (prev.includes(symbol)) {
        return prev.filter((s) => s !== symbol);
      } else {
        return [...prev, symbol];
      }
    });
  }, []);

  return {
    watchlist,
    quotes,
    isLoading,
    error,
    refresh,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
  };
}

// Hook for real-time price updates using WebSocket
export function useRealTimePrices(symbols: string[]) {
  const [prices, setPrices] = useState<Map<string, StockQuote>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (symbols.length === 0) return;

    // For now, fall back to polling (WebSocket setup could be added here if needed)
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/market/batch-quotes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ symbols }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch real-time prices');
        }

        const quotes: StockQuote[] = await response.json();
        const newPrices = new Map();
        quotes.forEach((quote) => {
          newPrices.set(quote.symbol, quote);
        });
        setPrices(newPrices);
        setIsConnected(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch prices');
        setIsConnected(false);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [symbols]);

  return {
    prices,
    isConnected,
    error,
  };
}
