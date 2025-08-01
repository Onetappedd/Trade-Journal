"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

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

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem("user")
    const storedProfile = localStorage.getItem("profile")

    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    if (storedProfile) {
      setProfile(JSON.parse(storedProfile))
    }

    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Mock authentication
      const mockUser: User = {
        id: "1",
        email,
        name: email.split("@")[0],
      }

      const mockProfile: Profile = {
        id: "1",
        user_id: "1",
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
    }
  }

  const signUp = async (
    email: string,
    password: string,
    name?: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Mock registration
      const mockUser: User = {
        id: "1",
        email,
        name: name || email.split("@")[0],
      }

      const mockProfile: Profile = {
        id: "1",
        user_id: "1",
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
    }
  }

  const signOut = async () => {
    setUser(null)
    setProfile(null)
    localStorage.removeItem("user")
    localStorage.removeItem("profile")
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
