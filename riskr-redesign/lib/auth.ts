// Authentication utilities for RiskR trading platform
// Handles session management, user authentication, and auth state

interface User {
  id: string
  email: string
  name: string
  onboarded: boolean
  createdAt: string
  lastLogin: string
}

interface Session {
  user: User
  token: string
  expiresAt: string
}

// Mock session storage - in production this would integrate with your auth provider
let mockSession: Session | null = null

export async function getSession(): Promise<Session | null> {
  // In production, this would:
  // 1. Check for auth token in cookies/localStorage
  // 2. Validate token with auth service
  // 3. Return user session data

  // For development, return mock session
  if (!mockSession) {
    mockSession = {
      user: {
        id: "user_123",
        email: "john.doe@example.com",
        name: "John Doe",
        onboarded: true,
        createdAt: "2024-01-01T00:00:00Z",
        lastLogin: new Date().toISOString(),
      },
      token: "mock_jwt_token",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    }
  }

  return mockSession
}

export async function signIn(email: string, password: string): Promise<Session> {
  // Mock sign in - in production this would call your auth API
  await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call

  const session: Session = {
    user: {
      id: "user_123",
      email,
      name: email.split("@")[0],
      onboarded: false, // New users need onboarding
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    },
    token: "mock_jwt_token",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }

  mockSession = session
  return session
}

export async function signOut(): Promise<void> {
  // Clear session
  mockSession = null

  // In production, this would:
  // 1. Invalidate token on server
  // 2. Clear cookies/localStorage
  // 3. Redirect to login page
}

export async function updateUserOnboarding(completed: boolean): Promise<void> {
  if (mockSession) {
    mockSession.user.onboarded = completed
  }
}

export function isAuthenticated(): boolean {
  return mockSession !== null
}

export function getCurrentUser(): User | null {
  return mockSession?.user || null
}
