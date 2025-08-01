"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

interface Profile {
  id: string
  display_name: string | null
  email: string
  avatar_url: string | null
  timezone: string | null
  default_broker: string | null
  default_asset_type: string | null
  risk_tolerance: string | null
  email_notifications: boolean | null
  push_notifications: boolean | null
  trade_alerts: boolean | null
  weekly_reports: boolean | null
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  updatePassword: (password: string) => Promise<{ error: any }>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const createMockProfile = (userId: string, userEmail?: string): Profile => ({
    id: userId,
    display_name: "Demo User",
    email: userEmail || "demo@example.com",
    avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${userEmail || "Demo User"}`,
    timezone: "America/New_York",
    default_broker: "webull",
    default_asset_type: "stock",
    risk_tolerance: "moderate",
    email_notifications: true,
    push_notifications: false,
    trade_alerts: true,
    weekly_reports: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  const fetchProfile = async (userId: string, userEmail?: string): Promise<Profile | null> => {
    // Always return mock data to avoid network issues
    console.log("Using mock profile data for user:", userId)
    return createMockProfile(userId, userEmail)
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        // Create a mock session for demo purposes
        const mockUser: User = {
          id: "demo-user-123",
          email: "demo@example.com",
          created_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {
            display_name: "Demo User",
          },
          aud: "authenticated",
          confirmation_sent_at: new Date().toISOString(),
          recovery_sent_at: new Date().toISOString(),
          email_change_sent_at: new Date().toISOString(),
          new_email: null,
          invited_at: null,
          action_link: null,
          email_confirmed_at: new Date().toISOString(),
          phone_confirmed_at: null,
          confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          role: "authenticated",
          updated_at: new Date().toISOString(),
          identities: [],
          factors: [],
        }

        const mockSession: Session = {
          access_token: "mock-access-token",
          refresh_token: "mock-refresh-token",
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          token_type: "bearer",
          user: mockUser,
        }

        setSession(mockSession)
        setUser(mockUser)

        const userProfile = await fetchProfile(mockUser.id, mockUser.email)
        setProfile(userProfile)
      } catch (error) {
        console.error("Failed to get initial session:", error)
        setUser(null)
        setSession(null)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      // Mock successful sign in
      const mockUser: User = {
        id: "demo-user-123",
        email: email,
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {
          display_name: email.split("@")[0],
        },
        aud: "authenticated",
        confirmation_sent_at: new Date().toISOString(),
        recovery_sent_at: new Date().toISOString(),
        email_change_sent_at: new Date().toISOString(),
        new_email: null,
        invited_at: null,
        action_link: null,
        email_confirmed_at: new Date().toISOString(),
        phone_confirmed_at: null,
        confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        role: "authenticated",
        updated_at: new Date().toISOString(),
        identities: [],
        factors: [],
      }

      const mockSession: Session = {
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: "bearer",
        user: mockUser,
      }

      setSession(mockSession)
      setUser(mockUser)

      const userProfile = await fetchProfile(mockUser.id, mockUser.email)
      setProfile(userProfile)

      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      })

      return { error: null }
    } catch (error: any) {
      const errorMessage = "Network error. Please check your connection."
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive",
      })
      return { error: { message: errorMessage } }
    }
  }

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      toast({
        title: "Account Created",
        description: "Welcome! Your demo account has been created.",
      })

      return { error: null }
    } catch (error: any) {
      const errorMessage = "Network error. Please check your connection."
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive",
      })
      return { error: { message: errorMessage } }
    }
  }

  const signOut = async () => {
    try {
      setUser(null)
      setSession(null)
      setProfile(null)

      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: "Failed to sign out",
        variant: "destructive",
      })
    }
  }

  const resetPassword = async (email: string) => {
    try {
      toast({
        title: "Reset Email Sent",
        description: "Check your email for password reset instructions.",
      })

      return { error: null }
    } catch (error: any) {
      const errorMessage = "Network error. Please check your connection."
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive",
      })
      return { error: { message: errorMessage } }
    }
  }

  const updatePassword = async (password: string) => {
    try {
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      })

      return { error: null }
    } catch (error: any) {
      const errorMessage = "Network error. Please check your connection."
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive",
      })
      return { error: { message: errorMessage } }
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: { message: "No user logged in" } }
    }

    try {
      // Update the local state with mock data
      setProfile((prev) => (prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : null))

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      })

      return { error: null }
    } catch (error: any) {
      const errorMessage = "Network error. Please check your connection."
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive",
      })
      return { error: { message: errorMessage } }
    }
  }

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Export both named and default for compatibility
export { AuthProvider as EnhancedAuthProvider }
export default AuthProvider
