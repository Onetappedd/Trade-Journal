"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface User {
  id: string
  email: string
  name?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function EnhancedAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = () => {
      try {
        const storedUser = localStorage.getItem("auth_user")
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
      } catch (error) {
        console.error("Error checking session:", error)
        localStorage.removeItem("auth_user")
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      // Mock authentication - in real app, this would be an API call
      if (email && password) {
        const mockUser = {
          id: "1",
          email: email,
          name: email.split("@")[0],
        }
        setUser(mockUser)
        localStorage.setItem("auth_user", JSON.stringify(mockUser))
        return { success: true }
      } else {
        return { success: false, error: "Please enter email and password" }
      }
    } catch (error) {
      return { success: false, error: "Authentication failed" }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    setLoading(true)
    try {
      // Mock sign up - in real app, this would be an API call
      const mockUser = {
        id: Math.random().toString(36).substr(2, 9),
        email: email,
        name: name || email.split("@")[0],
      }
      setUser(mockUser)
      localStorage.setItem("auth_user", JSON.stringify(mockUser))
      return { success: true }
    } catch (error) {
      return { success: false, error: "Sign up failed" }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setUser(null)
    localStorage.removeItem("auth_user")
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
