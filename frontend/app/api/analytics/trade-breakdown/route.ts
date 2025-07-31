import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Dummy API] Returning analytics trade breakdown dummy data');
  }
  return NextResponse.json({
    rrDistribution: [
      { range: "0-0.5", count: 10 },
      { range: "0.5-1", count: 25 },
      { range: "1-2", count: 40 },
      { range: "2-3", count: 20 },
      { range: "3+", count: 5 }
    ],
    maeDistribution: [
      { range: "0-0.2R", count: 30 },
      { range: "0.2-0.5R", count: 20 },
      { range: "0.5-1R", count: 10 },
      { range: "1R+", count: 5 }
    ],
    mfeDistribution: [
      { range: "0-0.5R", count: 15 },
      { range: "0.5-1R", count: 35 },
      { range: "1-2R", count: 20 },
      { range: "2R+", count: 10 }
    ]
  });
}
