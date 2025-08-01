"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem("trading-journal-user")
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        localStorage.removeItem("trading-journal-user")
      }
    }
    setIsLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)

    // Mock authentication - replace with real auth
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (email === "demo@example.com" && password === "password") {
      const mockUser = {
        id: "1",
        email: email,
        name: "Demo User",
      }
      setUser(mockUser)
      localStorage.setItem("trading-journal-user", JSON.stringify(mockUser))
      setIsLoading(false)
      return { success: true }
    }

    setIsLoading(false)
    return { success: false, error: "Invalid credentials" }
  }

  const signUp = async (email: string, password: string, name: string) => {
    setIsLoading(true)

    // Mock registration - replace with real auth
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const mockUser = {
      id: Math.random().toString(36).substr(2, 9),
      email: email,
      name: name,
    }
    setUser(mockUser)
    localStorage.setItem("trading-journal-user", JSON.stringify(mockUser))
    setIsLoading(false)
    return { success: true }
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem("trading-journal-user")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
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
