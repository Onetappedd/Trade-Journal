"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  name?: string
}

interface Profile {
  id: string
  user_id: string
  display_name?: string
  bio?: string
  timezone?: string
  notifications_enabled?: boolean
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing session
    try {
      const storedUser = localStorage.getItem("user")
      const storedProfile = localStorage.getItem("profile")

      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile))
      }
    } catch (error) {
      console.error("Error loading stored auth data:", error)
    }

    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true)

      // Mock authentication - simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        name: email.split("@")[0],
      }

      const mockProfile: Profile = {
        id: mockUser.id,
        user_id: mockUser.id,
        display_name: email.split("@")[0],
        timezone: "UTC",
        notifications_enabled: true,
      }

      setUser(mockUser)
      setProfile(mockProfile)

      localStorage.setItem("user", JSON.stringify(mockUser))
      localStorage.setItem("profile", JSON.stringify(mockProfile))

      return { success: true }
    } catch (error) {
      return { success: false, error: "Invalid credentials" }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (
    email: string,
    password: string,
    name?: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true)

      // Mock registration - simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        name: name || email.split("@")[0],
      }

      const mockProfile: Profile = {
        id: mockUser.id,
        user_id: mockUser.id,
        display_name: name || email.split("@")[0],
        timezone: "UTC",
        notifications_enabled: true,
      }

      setUser(mockUser)
      setProfile(mockProfile)

      localStorage.setItem("user", JSON.stringify(mockUser))
      localStorage.setItem("profile", JSON.stringify(mockProfile))

      return { success: true }
    } catch (error) {
      return { success: false, error: "Registration failed" }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setUser(null)
    setProfile(null)
    localStorage.removeItem("user")
    localStorage.removeItem("profile")
    router.push("/login")
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (profile) {
      const updatedProfile = { ...profile, ...updates }
      setProfile(updatedProfile)
      localStorage.setItem("profile", JSON.stringify(updatedProfile))
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
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

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
