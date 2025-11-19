'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface PerformanceChartProps {
  data: Array<{
    month: string;
    value: number;
  }>;
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  // If no data, show placeholder
  const chartData =
    data.length > 0
      ? data
      : [
          { month: 'Jan', value: 100000 },
          { month: 'Feb', value: 100000 },
          { month: 'Mar', value: 100000 },
          { month: 'Apr', value: 100000 },
          { month: 'May', value: 100000 },
          { month: 'Jun', value: 100000 },
          { month: 'Jul', value: 100000 },
          { month: 'Aug', value: 100000 },
          { month: 'Sep', value: 100000 },
          { month: 'Oct', value: 100000 },
          { month: 'Nov', value: 100000 },
          { month: 'Dec', value: 100000 },
        ];

  // Add benchmark data (simple 8% annual growth)
  const dataWithBenchmark = chartData.map((item, index) => ({
    ...item,
    benchmark: 100000 * Math.pow(1.08, index / 12),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={dataWithBenchmark}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value: any, name: string) => [
                `$${(value === null || value === undefined || isNaN(Number(value)) ? 0 : Number(value)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                name === 'value' ? 'Your Portfolio' : 'S&P 500',
              ]}
            />
            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} name="value" />
            <Line
              type="monotone"
              dataKey="benchmark"
              stroke="#6b7280"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="benchmark"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
