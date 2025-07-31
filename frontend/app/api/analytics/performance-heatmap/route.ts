import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const metricType = searchParams.get('metricType') || 'pnl';
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Dummy API] Returning analytics performance heatmap dummy data for ${metricType}`);
  }
  // Example: 7 days (0=Mon) x 24 hours
  const data = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 9; hour <= 16; hour++) { // Market hours 9-16
      data.push({ day, hour, value: Math.round(Math.sin(day + hour) * 100) });
    }
  }
  return NextResponse.json(data);
}
