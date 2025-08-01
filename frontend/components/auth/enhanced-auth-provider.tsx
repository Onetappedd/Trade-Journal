"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
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

  const fetchProfile = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching profile:", error)
          toast({
            title: "Error Fetching Profile",
            description: error.message,
            variant: "destructive",
          })
          return
        }

        if (data) {
          setProfile(data)
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
        if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
          toast({
            title: "Network Error: Cannot Connect to Database",
            description:
              "This is likely a CORS issue. Please ensure your app's URL is added to your Supabase project's 'CORS Origins' list in the API settings.",
            variant: "destructive",
            duration: 15000,
          })
        } else if (error instanceof Error) {
          toast({
            title: "Error",
            description: `An unexpected error occurred while fetching your profile: ${error.message}`,
            variant: "destructive",
          })
        }
      }
    },
    [supabase, toast],
  )

  useEffect(() => {
    const getSessionAndProfile = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        }
      } catch (e) {
        console.error("Error in getSessionAndProfile:", e)
        if (e instanceof Error) {
          toast({
            title: "Authentication Error",
            description: e.message,
            variant: "destructive",
          })
        }
      } finally {
        setLoading(false)
      }
    }

    getSessionAndProfile()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProfile, supabase.auth, toast])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string, displayName: string) => {
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
  }

  const signOut = async () => {
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
  }

  const signInWithOAuth = async (provider: Provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/reset-password`,
    })
    return { error }
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

export { AuthProvider as EnhancedAuthProvider }
