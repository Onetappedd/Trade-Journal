"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => void
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
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing session on mount
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        localStorage.removeItem("user")
      }
    }
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Demo credentials
    if (email === "demo@example.com" && password === "password") {
      const user = { id: "1", email, name: "Demo User" }
      setUser(user)
      localStorage.setItem("user", JSON.stringify(user))
      setLoading(false)
      return { success: true }
    }

    setLoading(false)
    return { success: false, error: "Invalid credentials" }
  }

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const user = { id: Date.now().toString(), email, name }
    setUser(user)
    localStorage.setItem("user", JSON.stringify(user))
    setLoading(false)
    return { success: true }
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem("user")
    router.push("/login")
  }

  return <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>{children}</AuthContext.Provider>
}
