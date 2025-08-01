"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function EnhancedAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      return data
    } catch (error) {
      console.error("Error fetching profile:", error)

      if (error instanceof TypeError && error.message === "Failed to fetch") {
        toast({
          title: "Connection Error",
          description: "Unable to connect to the database. Please check your network connection and try again.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Profile Error",
          description: "Failed to load user profile. Some features may not work correctly.",
          variant: "destructive",
        })
      }

      throw error
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
          try {
            await fetchProfile(session.user.id)
          } catch (error) {
            // Profile fetch failed, but we still have a user session
            console.warn("Profile fetch failed, continuing with session user")
          }
        }
      } catch (error) {
        console.error("Error getting session:", error)
        toast({
          title: "Authentication Error",
          description: "Failed to verify your session. Please try logging in again.",
          variant: "destructive",
        })
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
        try {
          await fetchProfile(session.user.id)
        } catch (error) {
          // Profile fetch failed, but we still have a user session
          console.warn("Profile fetch failed during auth state change")
        }
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase, toast])

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      })
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "Sign out error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
    }
  }

  const value = {
    user,
    loading,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an EnhancedAuthProvider")
  }
  return context
}
