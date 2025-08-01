import { type NextRequest, NextResponse } from "next/server"

// Mock profile data (same as above for consistency)
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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const profile = mockProfiles.find((p) => p.id === params.id)

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  return NextResponse.json(profile)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const profileIndex = mockProfiles.findIndex((p) => p.id === params.id)

    if (profileIndex === -1) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Update the profile
    const updatedProfile = {
      ...mockProfiles[profileIndex],
      ...body,
      updated_at: new Date().toISOString(),
    }

    mockProfiles[profileIndex] = updatedProfile

    return NextResponse.json(updatedProfile)
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const profileIndex = mockProfiles.findIndex((p) => p.id === params.id)

  if (profileIndex === -1) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  mockProfiles.splice(profileIndex, 1)

  return NextResponse.json({ message: "Profile deleted successfully" }, { status: 200 })
}
