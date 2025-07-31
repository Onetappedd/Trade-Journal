import { useState, useEffect } from 'react';
import { fetchCurrentPrice, fetchCompanyInfo } from '@/lib/api';

export function useTradeData(symbol: string) {
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [companyInfo, setCompanyInfo] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!symbol) {
      setCurrentPrice(null);
      setCompanyInfo(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const handler = setTimeout(() => {
      Promise.all([
        fetchCurrentPrice(symbol.trim().toUpperCase()),
        fetchCompanyInfo(symbol.trim().toUpperCase()),
      ])
        .then(([priceRes, infoRes]) => {
          setCurrentPrice(priceRes.price);
          setCompanyInfo(infoRes);
        })
        .catch(() => {
          setCurrentPrice(null);
          setCompanyInfo(null);
        })
        .finally(() => setIsLoading(false));
    }, 500);
    return () => clearTimeout(handler);
  }, [symbol]);

  return { currentPrice, companyInfo, isLoading };
}
