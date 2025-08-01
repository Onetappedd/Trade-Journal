import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    message: "Trading Journal API is running",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  })
}
