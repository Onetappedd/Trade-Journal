'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarDays, TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

interface Trade {
  id: string;
  date: Date;
  symbol: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  pnl?: number;
  status: 'profit' | 'loss' | 'neutral';
}

const mockTrades: Trade[] = [
  {
    id: '1',
    date: new Date(2024, 0, 15),
    symbol: 'AAPL',
    type: 'buy',
    quantity: 100,
    price: 185.25,
    pnl: 1250.0,
    status: 'profit',
  },
  {
    id: '2',
    date: new Date(2024, 0, 15),
    symbol: 'AAPL',
    type: 'sell',
    quantity: 100,
    price: 197.75,
    pnl: 1250.0,
    status: 'profit',
  },
  {
    id: '3',
    date: new Date(2024, 0, 22),
    symbol: 'TSLA',
    type: 'buy',
    quantity: 50,
    price: 248.5,
    pnl: -450.0,
    status: 'loss',
  },
  {
    id: '4',
    date: new Date(2024, 0, 22),
    symbol: 'TSLA',
    type: 'sell',
    quantity: 50,
    price: 239.5,
    pnl: -450.0,
    status: 'loss',
  },
  {
    id: '5',
    date: new Date(2024, 0, 28),
    symbol: 'NVDA',
    type: 'buy',
    quantity: 25,
    price: 520.0,
    status: 'neutral',
  },
];

export function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const getTradesForDate = (date: Date) => {
    return mockTrades.filter((trade) => isSameDay(trade.date, date));
  };

  const getTradesForMonth = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return mockTrades.filter((trade) => trade.date >= start && trade.date <= end);
  };

  const getDayPnL = (date: Date) => {
    const dayTrades = getTradesForDate(date);
    return dayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  };

  const getMonthlyStats = () => {
    const monthTrades = getTradesForMonth(selectedMonth);
    const totalPnL = monthTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const winningTrades = monthTrades.filter((trade) => (trade.pnl || 0) > 0).length;
    const losingTrades = monthTrades.filter((trade) => (trade.pnl || 0) < 0).length;
    const totalTrades = monthTrades.length;

    return {
      totalPnL,
      winningTrades,
      losingTrades,
      totalTrades,
      winRate: totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0,
    };
  };

  const monthlyStats = getMonthlyStats();
  const selectedDateTrades = selectedDate ? getTradesForDate(selectedDate) : [];

  const modifiers = {
    profitable: (date: Date) => getDayPnL(date) > 0,
    loss: (date: Date) => getDayPnL(date) < 0,
    neutral: (date: Date) => {
      const trades = getTradesForDate(date);
      return trades.length > 0 && getDayPnL(date) === 0;
    },
  };

  const modifiersStyles = {
    profitable: {
      backgroundColor: 'rgb(34 197 94)',
      color: 'white',
    },
    loss: {
      backgroundColor: 'rgb(239 68 68)',
      color: 'white',
    },
    neutral: {
      backgroundColor: 'rgb(156 163 175)',
      color: 'white',
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Trading Calendar</h2>
          <p className="text-muted-foreground">
            Track your trading activity and performance over time
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={viewMode} onValueChange={(value: 'month' | 'week') => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly P&L</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${monthlyStats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {monthlyStats.totalPnL >= 0 ? '+' : ''}${monthlyStats.totalPnL.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">{format(selectedMonth, 'MMMM yyyy')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyStats.totalTrades}</div>
            <p className="text-xs text-muted-foreground">
              {monthlyStats.winningTrades}W / {monthlyStats.losingTrades}L
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyStats.winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {monthlyStats.winningTrades} winning trades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trading Days</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                eachDayOfInterval({
                  start: startOfMonth(selectedMonth),
                  end: endOfMonth(selectedMonth),
                }).filter((date) => getTradesForDate(date).length > 0).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Active trading days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Calendar */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Trading Calendar</CardTitle>
            <CardDescription>
              Click on any date to view trades. Green = Profit, Red = Loss, Gray = Break-even
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={selectedMonth}
              onMonthChange={setSelectedMonth}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Selected Date Details */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a Date'}
            </CardTitle>
            <CardDescription>
              {selectedDateTrades.length > 0
                ? `${selectedDateTrades.length} trade${selectedDateTrades.length > 1 ? 's' : ''}`
                : 'No trades on this date'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDate && (
              <div className="space-y-4">
                {/* Daily P&L */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-medium">Daily P&L</span>
                  <span
                    className={`font-bold ${getDayPnL(selectedDate) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {getDayPnL(selectedDate) >= 0 ? '+' : ''}${getDayPnL(selectedDate).toFixed(2)}
                  </span>
                </div>

                {/* Trades List */}
                <div className="space-y-2">
                  {selectedDateTrades.map((trade) => (
                    <div
                      key={trade.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="flex items-center space-x-2">
                        <Badge variant={trade.type === 'buy' ? 'default' : 'secondary'}>
                          {trade.type.toUpperCase()}
                        </Badge>
                        <span className="font-medium">{trade.symbol}</span>
                        <span className="text-sm text-muted-foreground">
                          {trade.quantity} @ ${trade.price}
                        </span>
                      </div>
                      {trade.pnl !== undefined && (
                        <span
                          className={`text-sm font-medium ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {selectedDateTrades.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No trades on this date</p>
                    <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                      Add Trade
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>Key insights from your trading calendar</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="patterns" className="space-y-4">
            <TabsList>
              <TabsTrigger value="patterns">Trading Patterns</TabsTrigger>
              <TabsTrigger value="streaks">Win/Loss Streaks</TabsTrigger>
              <TabsTrigger value="frequency">Frequency Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="patterns" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Best Trading Day</h4>
                  <p className="text-2xl font-bold text-green-600">Monday</p>
                  <p className="text-sm text-muted-foreground">Average: +$425.50</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Most Active Day</h4>
                  <p className="text-2xl font-bold">Wednesday</p>
                  <p className="text-sm text-muted-foreground">12 trades this month</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="streaks" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                    Current Win Streak
                  </h4>
                  <p className="text-2xl font-bold text-green-600">3 days</p>
                  <p className="text-sm text-muted-foreground">Total: +$1,875.25</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center">
                    <TrendingDown className="h-4 w-4 mr-2 text-red-600" />
                    Longest Win Streak
                  </h4>
                  <p className="text-2xl font-bold">7 days</p>
                  <p className="text-sm text-muted-foreground">Jan 8-14, 2024</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="frequency" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Avg Trades/Day</h4>
                  <p className="text-2xl font-bold">2.4</p>
                  <p className="text-sm text-muted-foreground">When active</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Trading Days/Month</h4>
                  <p className="text-2xl font-bold">18</p>
                  <p className="text-sm text-muted-foreground">Out of 31 days</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Rest Days</h4>
                  <p className="text-2xl font-bold">13</p>
                  <p className="text-sm text-muted-foreground">No trading activity</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
