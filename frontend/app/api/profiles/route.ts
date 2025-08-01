import { type NextRequest, NextResponse } from "next/server"

// Mock profile data
const mockProfiles = [
  {
    id: "user-1",
    email: "trader@example.com",
    full_name: "John Trader",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
    timezone: "America/New_York",
    currency: "USD",
    trading_style: "swing",
    risk_tolerance: "moderate",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("user_id")

  if (userId) {
    const profile = mockProfiles.find((p) => p.id === userId)
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }
    return NextResponse.json(profile)
  }

  return NextResponse.json(mockProfiles)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const newProfile = {
      id: `user-${Date.now()}`,
      email: body.email,
      full_name: body.full_name || "",
      avatar_url: body.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${body.email}`,
      timezone: body.timezone || "America/New_York",
      currency: body.currency || "USD",
      trading_style: body.trading_style || "swing",
      risk_tolerance: body.risk_tolerance || "moderate",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    mockProfiles.push(newProfile)

    return NextResponse.json(newProfile, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }
}
