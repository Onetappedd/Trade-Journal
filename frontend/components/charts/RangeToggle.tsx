'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

const RANGES = ['1D','1W','1M','3M','YTD','1Y','ALL'] as const;

interface RangeToggleProps {
  className?: string;
}

export default function RangeToggle({ className = '' }: RangeToggleProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const current = (searchParams.get('range') || 'ALL').toUpperCase();
  
  const handleRangeChange = (range: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('range', range);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className={`flex gap-1 ${className}`}>
      {RANGES.map(r => (
        <Button
          key={r}
          variant={current === r ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleRangeChange(r)}
          className="px-2 py-1 text-xs h-auto"
        >
          {r}
        </Button>
      ))}
    </div>
  );
}
