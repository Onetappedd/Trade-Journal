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

// Storage keys for persistence
const AUTH_STORAGE_KEY = "trading-journal-auth"
const PROFILE_STORAGE_KEY = "trading-journal-profile"

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const createMockProfile = (userId: string, userEmail?: string): Profile => ({
    id: userId,
    display_name: userEmail?.split("@")[0] || "Demo User",
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

  const createMockUser = (email: string): User => ({
    id: `user-${Date.now()}`,
    email: email,
    created_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {
      display_name: email.split("@")[0],
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${email}`,
    },
    aud: "authenticated",
    confirmation_sent_at: new Date().toISOString(),
    recovery_sent_at: new Date().toISOString(),
    email_change_sent_at: new Date().toISOString(),
    new_email: undefined,
    invited_at: undefined,
    action_link: undefined,
    email_confirmed_at: new Date().toISOString(),
    phone_confirmed_at: undefined,
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    role: "authenticated",
    updated_at: new Date().toISOString(),
    identities: [],
    factors: [],
  })

  const createMockSession = (user: User): Session => ({
    access_token: `mock-token-${Date.now()}`,
    refresh_token: `mock-refresh-${Date.now()}`,
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user: user,
  })

  // Persist auth state to localStorage
  const persistAuthState = (user: User | null, session: Session | null, profile: Profile | null) => {
    if (typeof window !== "undefined") {
      try {
        if (user && session) {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, session }))
          if (profile) {
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
          }
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY)
          localStorage.removeItem(PROFILE_STORAGE_KEY)
        }
      } catch (error) {
        console.error("Error persisting auth state:", error)
      }
    }
  }

  // Load auth state from localStorage
  const loadPersistedAuthState = () => {
    if (typeof window !== "undefined") {
      try {
        const authData = localStorage.getItem(AUTH_STORAGE_KEY)
        const profileData = localStorage.getItem(PROFILE_STORAGE_KEY)

        if (authData) {
          const { user, session } = JSON.parse(authData)
          // Check if session is still valid
          if (session.expires_at > Math.floor(Date.now() / 1000)) {
            return {
              user,
              session,
              profile: profileData ? JSON.parse(profileData) : createMockProfile(user.id, user.email),
            }
          }
        }
      } catch (error) {
        console.error("Error loading persisted auth state:", error)
      }
    }
    return null
  }

  useEffect(() => {
    // Load persisted auth state on mount
    const initializeAuth = () => {
      const persistedState = loadPersistedAuthState()

      if (persistedState) {
        setUser(persistedState.user)
        setSession(persistedState.session)
        setProfile(persistedState.profile)
      } else {
        // Auto-login for demo purposes
        const demoUser = createMockUser("demo@example.com")
        const demoSession = createMockSession(demoUser)
        const demoProfile = createMockProfile(demoUser.id, demoUser.email)

        setUser(demoUser)
        setSession(demoSession)
        setProfile(demoProfile)

        persistAuthState(demoUser, demoSession, demoProfile)
      }

      setLoading(false)
    }

    initializeAuth()
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock authentication - accept any email/password for demo
      const mockUser = createMockUser(email)
      const mockSession = createMockSession(mockUser)
      const mockProfile = createMockProfile(mockUser.id, mockUser.email)

      setUser(mockUser)
      setSession(mockSession)
      setProfile(mockProfile)

      // Persist to localStorage
      persistAuthState(mockUser, mockSession, mockProfile)

      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      })

      setLoading(false)
      return { error: null }
    } catch (error: any) {
      setLoading(false)
      const errorMessage = "Failed to sign in. Please try again."
      toast({
        title: "Sign In Error",
        description: errorMessage,
        variant: "destructive",
      })
      return { error: { message: errorMessage } }
    }
  }

  const signUp = async (email: string, password: string, displayName?: string) => {
    setLoading(true)

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockUser = createMockUser(email)
      const mockSession = createMockSession(mockUser)
      const mockProfile = createMockProfile(mockUser.id, mockUser.email)

      setUser(mockUser)
      setSession(mockSession)
      setProfile(mockProfile)

      // Persist to localStorage
      persistAuthState(mockUser, mockSession, mockProfile)

      toast({
        title: "Account Created",
        description: "Welcome! Your account has been created successfully.",
      })

      setLoading(false)
      return { error: null }
    } catch (error: any) {
      setLoading(false)
      const errorMessage = "Failed to create account. Please try again."
      toast({
        title: "Sign Up Error",
        description: errorMessage,
        variant: "destructive",
      })
      return { error: { message: errorMessage } }
    }
  }

  const signOut = async () => {
    setLoading(true)

    try {
      setUser(null)
      setSession(null)
      setProfile(null)

      // Clear persisted state
      persistAuthState(null, null, null)

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
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Reset Email Sent",
        description: "Check your email for password reset instructions.",
      })

      return { error: null }
    } catch (error: any) {
      const errorMessage = "Failed to send reset email. Please try again."
      toast({
        title: "Reset Password Error",
        description: errorMessage,
        variant: "destructive",
      })
      return { error: { message: errorMessage } }
    }
  }

  const updatePassword = async (password: string) => {
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      })

      return { error: null }
    } catch (error: any) {
      const errorMessage = "Failed to update password. Please try again."
      toast({
        title: "Update Password Error",
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
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      const updatedProfile = profile ? { ...profile, ...updates, updated_at: new Date().toISOString() } : null
      setProfile(updatedProfile)

      // Persist updated profile
      persistAuthState(user, session, updatedProfile)

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      })

      return { error: null }
    } catch (error: any) {
      const errorMessage = "Failed to update profile. Please try again."
      toast({
        title: "Update Profile Error",
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
