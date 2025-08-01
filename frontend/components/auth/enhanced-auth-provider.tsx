"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

interface Profile {
  id: string
  display_name?: string
  avatar_url?: string
  email?: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: any | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: any }>
  signUp: (email: string, password: string) => Promise<{ error?: any }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
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
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Check for existing session in localStorage
    const storedUser = localStorage.getItem("auth-user")
    const storedProfile = localStorage.getItem("auth-profile")

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        setSession({ user: parsedUser })

        if (storedProfile) {
          setProfile(JSON.parse(storedProfile))
        } else {
          // Create default profile from user data
          const defaultProfile = {
            id: parsedUser.id,
            display_name: parsedUser.user_metadata?.full_name || parsedUser.email?.split("@")[0],
            avatar_url:
              parsedUser.user_metadata?.avatar_url ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${parsedUser.email}`,
            email: parsedUser.email,
          }
          setProfile(defaultProfile)
          localStorage.setItem("auth-profile", JSON.stringify(defaultProfile))
        }
      } catch (error) {
        console.error("Error parsing stored auth data:", error)
        localStorage.removeItem("auth-user")
        localStorage.removeItem("auth-profile")
      }
    }

    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock authentication - accept any email/password for demo
      if (email && password) {
        const mockUser: User = {
          id: `user-${Date.now()}`,
          email,
          user_metadata: {
            full_name: email.split("@")[0],
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          },
          app_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
        }

        const mockProfile: Profile = {
          id: mockUser.id,
          display_name: mockUser.user_metadata?.full_name,
          avatar_url: mockUser.user_metadata?.avatar_url,
          email: mockUser.email,
        }

        setUser(mockUser)
        setProfile(mockProfile)
        setSession({ user: mockUser })

        // Store in localStorage
        localStorage.setItem("auth-user", JSON.stringify(mockUser))
        localStorage.setItem("auth-profile", JSON.stringify(mockProfile))

        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        })

        setLoading(false)
        return { error: null }
      }

      setLoading(false)
      return { error: { message: "Please provide valid email and password" } }
    } catch (error) {
      setLoading(false)
      toast({
        title: "Sign In Error",
        description: "Failed to sign in. Please try again.",
        variant: "destructive",
      })
      return { error: { message: "Failed to sign in" } }
    }
  }

  const signUp = async (email: string, password: string) => {
    setLoading(true)

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock sign up - accept any email/password for demo
      if (email && password) {
        const mockUser: User = {
          id: `user-${Date.now()}`,
          email,
          user_metadata: {
            full_name: email.split("@")[0],
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          },
          app_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
        }

        const mockProfile: Profile = {
          id: mockUser.id,
          display_name: mockUser.user_metadata?.full_name,
          avatar_url: mockUser.user_metadata?.avatar_url,
          email: mockUser.email,
        }

        setUser(mockUser)
        setProfile(mockProfile)
        setSession({ user: mockUser })

        // Store in localStorage
        localStorage.setItem("auth-user", JSON.stringify(mockUser))
        localStorage.setItem("auth-profile", JSON.stringify(mockProfile))

        toast({
          title: "Account Created!",
          description: "Welcome! Your account has been created successfully.",
        })

        setLoading(false)
        return { error: null }
      }

      setLoading(false)
      return { error: { message: "Please provide valid email and password" } }
    } catch (error) {
      setLoading(false)
      toast({
        title: "Sign Up Error",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      })
      return { error: { message: "Failed to create account" } }
    }
  }

  const signOut = async () => {
    setUser(null)
    setProfile(null)
    setSession(null)
    localStorage.removeItem("auth-user")
    localStorage.removeItem("auth-profile")

    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    })
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (profile) {
      const updatedProfile = { ...profile, ...updates }
      setProfile(updatedProfile)
      localStorage.setItem("auth-profile", JSON.stringify(updatedProfile))

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      })
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Export both named and default for compatibility
export { AuthProvider as EnhancedAuthProvider }
export default AuthProvider
