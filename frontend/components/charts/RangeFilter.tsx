'use client';

import { useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export type TimeRange = '1D' | '1W' | '1M' | '3M' | 'YTD' | '1Y' | 'ALL';

interface RangeFilterProps {
  className?: string;
  availableDataPoints?: number;
}

const RANGE_OPTIONS: { value: TimeRange; label: string; days?: number }[] = [
  { value: '1D', label: '1D', days: 1 },
  { value: '1W', label: '1W', days: 7 },
  { value: '1M', label: '1M', days: 30 },
  { value: '3M', label: '3M', days: 90 },
  { value: 'YTD', label: 'YTD' },
  { value: '1Y', label: '1Y', days: 365 },
  { value: 'ALL', label: 'ALL' },
];

export function RangeFilter({ className, availableDataPoints = 0 }: RangeFilterProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentRange = (searchParams.get('range') as TimeRange) || 'ALL';

  const updateRange = useCallback(
    (range: TimeRange) => {
      const params = new URLSearchParams(searchParams);
      params.set('range', range);
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );

  // Calculate if ranges are available based on data points
  const isRangeAvailable = useCallback(
    (range: TimeRange) => {
      if (range === 'ALL') return true;
      if (range === 'YTD') {
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        const daysSinceStartOfYear = Math.ceil((Date.now() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
        return availableDataPoints >= Math.min(daysSinceStartOfYear, 30); // Require at least 30 days or YTD days
      }
      
      const rangeOption = RANGE_OPTIONS.find(opt => opt.value === range);
      if (!rangeOption?.days) return true;
      
      // Require at least 50% of the range days to be available
      return availableDataPoints >= Math.max(rangeOption.days * 0.5, 7);
    },
    [availableDataPoints]
  );

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {RANGE_OPTIONS.map((option) => {
        const isAvailable = isRangeAvailable(option.value);
        const isActive = currentRange === option.value;
        
        return (
          <Button
            key={option.value}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateRange(option.value)}
            disabled={!isAvailable}
            className={cn(
              'h-8 px-3 text-xs font-medium transition-colors',
              !isAvailable && 'opacity-50 cursor-not-allowed'
            )}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}

// Utility function to filter data based on range
export function filterDataByRange<T extends { date: string }>(
  data: T[],
  range: TimeRange,
  referenceDate?: Date
): T[] {
  if (!data || data.length === 0) return [];
  if (range === 'ALL') return data;

  const refDate = referenceDate || new Date();
  let startDate: Date;

  switch (range) {
    case '1D':
      startDate = new Date(refDate);
      startDate.setDate(startDate.getDate() - 1);
      break;
    case '1W':
      startDate = new Date(refDate);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '1M':
      startDate = new Date(refDate);
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case '3M':
      startDate = new Date(refDate);
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case 'YTD':
      startDate = new Date(refDate.getFullYear(), 0, 1);
      break;
    case '1Y':
      startDate = new Date(refDate);
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      return data;
  }

  // Ensure we have at least one data point if the range would be empty
  const filtered = data.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= startDate && itemDate <= refDate;
  });

  // If filtered data is empty but we have original data, return the most recent point
  if (filtered.length === 0 && data.length > 0) {
    const sortedData = [...data].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return [sortedData[0]];
  }

  return filtered;
}
