import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: "Symbol parameter is required" }, { status: 400 });
  }

  try {
    const backendUrl = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";
    // Use the correct backend endpoint for company info
    const response = await fetch(`${backendUrl}/prices/${symbol}/overview`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Backend error for ${symbol} info:`, errorData.error);
      return NextResponse.json({ error: errorData.error || "Failed to fetch company info from backend" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in Next.js API route for company info:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
