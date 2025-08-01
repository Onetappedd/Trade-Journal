"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  email: string
  user_metadata?: {
    display_name?: string
    avatar_url?: string
  }
}

interface Profile {
  id: string
  display_name: string
  avatar_url: string
  bio?: string
  timezone?: string
  notifications_enabled?: boolean
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: any
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: any }>
  signUp: (email: string, password: string) => Promise<{ error?: any }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check for existing session in localStorage
    const storedUser = localStorage.getItem("auth_user")
    const storedProfile = localStorage.getItem("auth_profile")

    if (storedUser) {
      const userData = JSON.parse(storedUser)
      setUser(userData)
      setSession({ user: userData })

      if (storedProfile) {
        setProfile(JSON.parse(storedProfile))
      } else {
        // Create default profile
        const defaultProfile = {
          id: userData.id,
          display_name: userData.user_metadata?.display_name || userData.email?.split("@")[0] || "User",
          avatar_url:
            userData.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${userData.email}`,
          bio: "",
          timezone: "UTC",
          notifications_enabled: true,
        }
        setProfile(defaultProfile)
        localStorage.setItem("auth_profile", JSON.stringify(defaultProfile))
      }
    }

    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string): Promise<{ error?: any }> => {
    try {
      setLoading(true)

      // Mock authentication - in real app, this would call Supabase
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        user_metadata: {
          display_name: email.split("@")[0],
          avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${email}`,
        },
      }

      const mockProfile: Profile = {
        id: mockUser.id,
        display_name: mockUser.user_metadata?.display_name || "User",
        avatar_url: mockUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${email}`,
        bio: "",
        timezone: "UTC",
        notifications_enabled: true,
      }

      setUser(mockUser)
      setProfile(mockProfile)
      setSession({ user: mockUser })

      localStorage.setItem("auth_user", JSON.stringify(mockUser))
      localStorage.setItem("auth_profile", JSON.stringify(mockProfile))

      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      })

      return { error: null }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign in. Please try again.",
        variant: "destructive",
      })
      return { error: { message: "Failed to sign in" } }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string): Promise<{ error?: any }> => {
    try {
      setLoading(true)

      // Mock sign up - in real app, this would call Supabase
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        user_metadata: {
          display_name: email.split("@")[0],
          avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${email}`,
        },
      }

      const mockProfile: Profile = {
        id: mockUser.id,
        display_name: mockUser.user_metadata?.display_name || "User",
        avatar_url: mockUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${email}`,
        bio: "",
        timezone: "UTC",
        notifications_enabled: true,
      }

      setUser(mockUser)
      setProfile(mockProfile)
      setSession({ user: mockUser })

      localStorage.setItem("auth_user", JSON.stringify(mockUser))
      localStorage.setItem("auth_profile", JSON.stringify(mockProfile))

      toast({
        title: "Account created!",
        description: "Your account has been created successfully.",
      })

      return { error: null }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      })
      return { error: { message: "Failed to create account" } }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)

      setUser(null)
      setProfile(null)
      setSession(null)

      localStorage.removeItem("auth_user")
      localStorage.removeItem("auth_profile")

      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      })

      router.push("/login")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!profile) return

      const updatedProfile = { ...profile, ...updates }
      setProfile(updatedProfile)
      localStorage.setItem("auth_profile", JSON.stringify(updatedProfile))

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
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

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
