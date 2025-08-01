"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
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
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  updateProfile: (updates: any) => Promise<{ error: any }>
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
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem("auth-user")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("auth-user")
      }
    }
    setLoading(false)

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Add avatar_url to user metadata if not present
        const userWithAvatar = {
          ...session.user,
          user_metadata: {
            ...session.user.user_metadata,
            avatar_url:
              session.user.user_metadata?.avatar_url ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`,
            full_name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
          },
        }
        setUser(userWithAvatar)
        localStorage.setItem("auth-user", JSON.stringify(userWithAvatar))
      } else {
        setUser(null)
        localStorage.removeItem("auth-user")
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (data.user && !error) {
      const userWithAvatar = {
        ...data.user,
        user_metadata: {
          ...data.user.user_metadata,
          avatar_url: data.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          full_name: data.user.user_metadata?.full_name || email.split("@")[0] || "User",
        },
      }
      setUser(userWithAvatar)
      localStorage.setItem("auth-user", JSON.stringify(userWithAvatar))
    }

    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          full_name: email.split("@")[0] || "User",
        },
      },
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    localStorage.removeItem("auth-user")
  }

  const updateProfile = async (updates: any) => {
    const { data, error } = await supabase.auth.updateUser({
      data: updates,
    })

    if (data.user && !error) {
      const updatedUser = {
        ...data.user,
        user_metadata: {
          ...data.user.user_metadata,
          avatar_url:
            data.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.email}`,
          full_name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "User",
        },
      }
      setUser(updatedUser)
      localStorage.setItem("auth-user", JSON.stringify(updatedUser))
    }

    return { error }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Export both named and default for compatibility
export { AuthProvider as EnhancedAuthProvider }
export default AuthProvider
