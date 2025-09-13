'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Calendar props are now purely realized; data is fetched based on visible range
export function PnLCalendar() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyPnL, setDailyPnL] = useState<Record<string, number>>({});
  const [tradesByDay, setTradesByDay] = useState<
    Record<
      string,
      Array<{
        id: string;
        symbol: string;
        quantity: number;
        entry_price: number;
        exit_price: number;
        realized: number;
      }>
    >
  >({});
  const [debug, setDebug] = useState<boolean>(
    process.env.NODE_ENV !== 'production' ? false : false,
  );
  const [summary, setSummary] = useState<{ total: number; trades: number; pct: number }>({
    total: 0,
    trades: 0,
    pct: 0,
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Helpers
  const toISO = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const startOfCalendar = useMemo(() => {
    const first = new Date(month);
    const dow = first.getDay();
    const start = new Date(first);
    start.setDate(first.getDate() - dow);
    start.setHours(0, 0, 0, 0);
    return start;
  }, [month]);

  const endOfCalendar = useMemo(() => {
    const first = new Date(month);
    const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
    const dow = last.getDay();
    const end = new Date(last);
    end.setDate(last.getDate() + (6 - dow));
    end.setHours(23, 59, 59, 999);
    return end;
  }, [month]);

  const daysArray = useMemo(() => {
    const arr: Date[] = [];
    const cur = new Date(startOfCalendar);
    while (cur <= endOfCalendar) {
      arr.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return arr;
  }, [startOfCalendar, endOfCalendar]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const start = toISO(startOfCalendar);
      const end = toISO(endOfCalendar);
      const res = await fetch(
        `/api/calendar-realized?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      const j = (await res.json()) as {
        dailyPnL: Record<string, number>;
        tradesByDay: Record<string, any[]>;
      };
      const daily = j.dailyPnL || {};
      const byDay = j.tradesByDay || {};
      setDailyPnL(daily);
      setTradesByDay(byDay);
      // Compute summary for P&L card: total P&L, trades taken, % gain vs $10k baseline over visible range
      const total = Object.values(daily).reduce((s, v) => s + v, 0);
      const trades = Object.values(byDay).reduce((s, arr) => s + (arr?.length || 0), 0);
      const base = 10000;
      const pct = base > 0 ? (total / base) * 100 : 0;
      setSummary({ total, trades, pct });
    } catch (e: any) {
      setError(e?.message || 'Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  }, [startOfCalendar, endOfCalendar]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  );

  const colorFor = (value: number, isToday: boolean) => {
    if (value > 0) {
      return cn(
        'text-green-900 dark:text-green-100',
        value <= 100 &&
          'bg-green-100 hover:bg-green-200 dark:bg-green-950/50 dark:hover:bg-green-900/50',
        value > 100 &&
          value <= 500 &&
          'bg-green-200 hover:bg-green-300 dark:bg-green-900/60 dark:hover:bg-green-800/60',
        value > 500 &&
          value <= 1000 &&
          'bg-green-300 hover:bg-green-400 dark:bg-green-800/70 dark:hover:bg-green-700/70',
        value > 1000 &&
          'bg-green-400 hover:bg-green-500 dark:bg-green-700/80 dark:hover:bg-green-600/80',
        isToday && 'ring-2 ring-blue-500 dark:ring-blue-400',
      );
    }
    if (value < 0) {
      return cn(
        'text-red-900 dark:text-red-100',
        value >= -100 && 'bg-red-100 hover:bg-red-200 dark:bg-red-950/50 dark:hover:bg-red-900/50',
        value < -100 &&
          value >= -500 &&
          'bg-red-200 hover:bg-red-300 dark:bg-red-900/60 dark:hover:bg-red-800/60',
        value < -500 &&
          value >= -1000 &&
          'bg-red-300 hover:bg-red-400 dark:bg-red-800/70 dark:hover:bg-red-700/70',
        value < -1000 && 'bg-red-400 hover:bg-red-500 dark:bg-red-700/80 dark:hover:bg-red-600/80',
        isToday && 'ring-2 ring-blue-500 dark:ring-blue-400',
      );
    }
    return cn(
      'bg-gray-50 hover:bg-gray-100 text-gray-600',
      'dark:bg-gray-900/30 dark:hover:bg-gray-800/40 dark:text-gray-400',
      isToday && 'ring-2 ring-blue-500 dark:ring-blue-400',
    );
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const isToday = (d: Date) => {
    const t = new Date();
    return (
      d.getFullYear() === t.getFullYear() &&
      d.getMonth() === t.getMonth() &&
      d.getDate() === t.getDate()
    );
  };

  const prevMonth = () => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              P&L Calendar
            </CardTitle>
            <CardDescription>Daily realized P&L heatmap</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={prevMonth} aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm tabular-nums w-28 text-center">
              {month.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <Button variant="ghost" size="icon" onClick={nextMonth} aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-2 flex flex-row gap-2 items-center">
          <Button
            size="sm"
            variant={debug ? 'default' : 'outline'}
            onClick={() => setDebug((d) => !d)}
          >
            {debug ? 'Hide Debug JSON' : 'Show Debug JSON'}
          </Button>
          {debug && (
            <span className="text-xs text-muted-foreground">
              Developer mode: shows API payload.
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {debug && (
          <div className="my-4 p-2 rounded bg-muted/30 text-xs max-h-56 overflow-auto border">
            <pre className="break-all whitespace-pre-wrap text-[11px]">
              {JSON.stringify({ dailyPnL, tradesByDay }, null, 2)}
            </pre>
          </div>
        )}
        <div className="space-y-3 max-w-2xl mx-auto">
          {/* Summary card for visible range */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-md border p-2 text-center">
              <div className="text-xs text-muted-foreground">Profit/Loss</div>
              <div
                className={`text-sm font-semibold ${summary.total >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {summary.total >= 0 ? '+' : ''}
                {Math.abs(summary.total).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="rounded-md border p-2 text-center">
              <div className="text-xs text-muted-foreground">Trades Taken</div>
              <div className="text-sm font-semibold">{summary.trades}</div>
            </div>
            <div className="rounded-md border p-2 text-center">
              <div className="text-xs text-muted-foreground">% Gain</div>
              <div
                className={`text-sm font-semibold ${summary.pct >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {summary.pct.toFixed(2)}%
              </div>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {weekDays.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground p-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {daysArray.map((d) => {
              const key = toISO(d);
              const pnl = dailyPnL[key] || 0;
              const dayNum = d.getDate();
              const inMonth = d.getMonth() === month.getMonth();
              const classes = cn(
                'aspect-square p-1 rounded cursor-pointer transition-colors flex flex-col items-center justify-center text-xs',
                colorFor(pnl, isToday(d)),
                !inMonth && 'opacity-50',
              );
              return (
                <TooltipProvider key={key}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={classes} onClick={() => setSelectedDay(key)}>
                        <span className="font-medium leading-none">{dayNum}</span>
                        <span className="text-[10px] font-semibold leading-none mt-0.5">
                          {pnl === 0
                            ? '-'
                            : `${pnl >= 0 ? '+' : '-'}${Math.abs(pnl) >= 1000 ? `${(Math.abs(pnl) / 1000).toFixed(1)}k` : Math.abs(pnl).toFixed(0)}`}
                        </span>
                        {debug && <span className="mt-0.5 text-[9px] opacity-70">{key}</span>}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="w-64 p-3">
                      <div className="space-y-2">
                        <div className="font-semibold">
                          {d.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Realized P&L:</span>
                          <span className={pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency.format(pnl)}
                          </span>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
          {error && <div className="text-xs text-red-600">{error}</div>}
          {loading && (
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: daysArray.length }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded bg-muted/40" />
              ))}
            </div>
          )}
        </div>

        {/* Drilldown drawer/modal */}
        {selectedDay && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 p-4"
            onClick={() => setSelectedDay(null)}
          >
            <div
              className="w-full max-w-md rounded-lg bg-background p-4 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">{new Date(selectedDay).toLocaleDateString()}</div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedDay(null)}>
                  Close
                </Button>
              </div>
              <div className="space-y-2 max-h-80 overflow-auto">
                {(tradesByDay[selectedDay] || []).length === 0 ? (
                  <div className="text-sm text-muted-foreground">No closed trades</div>
                ) : (
                  tradesByDay[selectedDay].map((t) => (
                    <div key={t.id} className="text-sm flex justify-between border-b py-1">
                      <div>
                        <div className="font-medium">{t.symbol}</div>
                        <div className="text-xs text-muted-foreground">
                          Qty {t.quantity} · Entry {formatCurrency.format(t.entry_price)} · Exit{' '}
                          {formatCurrency.format(t.exit_price)}
                        </div>
                      </div>
                      <div className={t.realized >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency.format(t.realized)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
