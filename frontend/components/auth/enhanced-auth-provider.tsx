"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  timezone: string | null
  currency: string | null
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  updatePassword: (password: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        console.error("Error fetching profile:", error)
        // Return mock profile data when Supabase is not available
        return {
          id: userId,
          full_name: "Demo User",
          avatar_url: null,
          timezone: "America/New_York",
          currency: "USD",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      }

      return data
    } catch (error) {
      console.error("Network error fetching profile:", error)
      // Return mock profile data when network fails (CORS issues, etc.)
      return {
        id: userId,
        full_name: "Demo User",
        avatar_url: null,
        timezone: "America/New_York",
        currency: "USD",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        const userProfile = await fetchProfile(session.user.id)
        setProfile(userProfile)
      } else {
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

      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        })
      }

      return { error }
    } catch (error) {
      const errorMessage = "Network error. Please check your connection."
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive",
      })
      return { error: { message: errorMessage } }
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Account Created",
          description: "Please check your email to verify your account.",
        })
      }

      return { error }
    } catch (error) {
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
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast({
          title: "Sign Out Failed",
          description: error.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        toast({
          title: "Reset Failed",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Reset Email Sent",
          description: "Check your email for password reset instructions.",
        })
      }

      return { error }
    } catch (error) {
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
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        toast({
          title: "Update Failed",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Password Updated",
          description: "Your password has been successfully updated.",
        })
      }

      return { error }
    } catch (error) {
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
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Export both named and default for compatibility
export { AuthProvider as default }
