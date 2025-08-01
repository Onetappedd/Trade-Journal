"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User, Provider } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface AuthContextType {
  user: User | null
  loading: boolean
  profile: any
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  signInWithOAuth: (provider: Provider) => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const fetchProfile = async (userId: string) => {
    try {
      // For now, we'll skip the profile fetch to avoid CORS issues
      // This can be enabled once Supabase CORS is configured
      console.log("Profile fetch skipped - using mock data")

      // Mock profile data
      const mockProfile = {
        id: userId,
        full_name: user?.user_metadata?.full_name || "Trading User",
        avatar_url: user?.user_metadata?.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${userId}`,
        timezone: "America/New_York",
        currency: "USD",
        created_at: new Date().toISOString(),
      }

      setProfile(mockProfile)
      return mockProfile
    } catch (error) {
      console.error("Error fetching profile:", error)

      if (error instanceof TypeError && error.message === "Failed to fetch") {
        console.warn("CORS error - using mock profile data")
        // Don't show toast for CORS errors, just use mock data
        const mockProfile = {
          id: userId,
          full_name: "Trading User",
          avatar_url: `https://api.dicebear.com/8.x/initials/svg?seed=${userId}`,
          timezone: "America/New_York",
          currency: "USD",
        }
        setProfile(mockProfile)
        return mockProfile
      } else {
        toast({
          title: "Profile Error",
          description: "Failed to load user profile. Using default settings.",
          variant: "destructive",
        })
      }
      return null
    }
  }

  useEffect(() => {
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchProfile(session.user.id)
        }
      } catch (error) {
        console.error("Error getting session:", error)
        // Don't show toast for session errors in development
        console.warn("Session error - continuing without authentication")
      } finally {
        setLoading(false)
      }
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)

      if (session?.user && event === "SIGNED_IN") {
        await fetchProfile(session.user.id)
      } else if (!session?.user) {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      console.error("Sign in error:", error)
      return { error }
    }
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName,
            avatar_url: `https://api.dicebear.com/8.x/initials/svg?seed=${displayName}`,
          },
        },
      })
      return { error }
    } catch (error) {
      console.error("Sign up error:", error)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
        throw error
      }

      toast({
        title: "Success",
        description: "Signed out successfully!",
      })

      router.push("/login")
    } catch (error) {
      console.error("Sign out error:", error)
      // Force redirect even if signOut fails
      router.push("/login")
    }
  }

  const signInWithOAuth = async (provider: Provider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${location.origin}/auth/callback`,
        },
      })
      return { error }
    } catch (error) {
      console.error("OAuth sign in error:", error)
      return { error }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/auth/reset-password`,
      })
      return { error }
    } catch (error) {
      console.error("Reset password error:", error)
      return { error }
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    profile,
    signInWithOAuth,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Export as both named and default for compatibility
export { AuthProvider as EnhancedAuthProvider }
export default AuthProvider
