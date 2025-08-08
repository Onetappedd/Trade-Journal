"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TrendingUp, Mail, Lock, User, Eye, EyeOff } from "lucide-react"

const USERNAME_REGEX = /^[a-z0-9]{3,15}$/

// Google SVG icon
const GoogleIcon = () => (
  <svg className="h-5 w-5 mr-2" viewBox="0 0 48 48">
    <g>
      <path fill="#4285F4" d="M24 9.5c3.54 0 6.36 1.53 7.82 2.81l5.77-5.77C34.64 3.36 29.74 1 24 1 14.82 1 6.88 6.98 3.44 15.09l6.91 5.36C12.13 14.09 17.62 9.5 24 9.5z"/>
      <path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.21-.43-4.73H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.19 5.6C43.98 37.36 46.1 31.45 46.1 24.55z"/>
      <path fill="#FBBC05" d="M10.35 28.45c-1.04-3.09-1.04-6.41 0-9.5l-6.91-5.36C.99 17.36 0 20.57 0 24c0 3.43.99 6.64 3.44 9.41l6.91-5.36z"/>
      <path fill="#EA4335" d="M24 46.5c5.74 0 10.54-1.89 14.06-5.14l-7.19-5.6c-2.01 1.35-4.59 2.14-7.37 2.14-6.38 0-11.87-4.59-13.65-10.86l-6.91 5.36C6.88 41.02 14.82 46.5 24 46.5z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </g>
  </svg>
)

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Signup fields and username validation state
  const [signupFullName, setSignupFullName] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [username, setUsername] = useState("")
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle")
  const [usernameMsg, setUsernameMsg] = useState("")
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const router = useRouter()
  const supabase = createClient()

  // LOGIN HANDLER
  const handleLogin = async (formData: FormData) => {
    setIsLoading(true)
    setMessage(null)

    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMessage({ type: "error", text: error.message })
      } else {
        setMessage({ type: "success", text: "Login successful! Redirecting..." })
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error) {
      setMessage({ type: "error", text: "An unexpected error occurred" })
    } finally {
      setIsLoading(false)
    }
  }

  // SIGNUP HANDLER
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    const v = username.toLowerCase()
    if (!USERNAME_REGEX.test(v)) {
      setUsernameStatus("invalid")
      setMessage({ type: "error", text: "Invalid username format." })
      return
    }

    // Re-check availability to avoid race conditions
    try {
      const res = await fetch(`/api/username-check?username=${v}`)
      const json = await res.json()
      if (!res.ok || !json.available) {
        setUsernameStatus("taken")
        setMessage({ type: "error", text: "Username is already taken." })
        return
      }
    } catch {
      setMessage({ type: "error", text: "Could not verify username availability." })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: { full_name: signupFullName, username: v },
          emailRedirectTo: process.env.NODE_ENV === "production"
            ? "https://v0-modern-trading-dashboard-liard.vercel.app/auth/callback"
            : "http://localhost:3000/auth/callback",
        },
      })

      if (error) {
        setMessage({ type: "error", text: error.message })
      } else {
        setMessage({ type: "success", text: "Account created! Please check your email to verify your account." })
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred" })
    } finally {
      setIsLoading(false)
    }
  }

  // USERNAME CHECK HELPERS
  const checkUsername = async (value: string) => {
    const v = value.toLowerCase()
    if (!USERNAME_REGEX.test(v)) {
      setUsernameStatus("invalid")
      setUsernameMsg("Username must be 3-15 lowercase letters or numbers.")
      return
    }
    setUsernameStatus("checking")
    setUsernameMsg("Checking...")
    try {
      const res = await fetch(`/api/username-check?username=${v}`)
      const json = await res.json()
      if (res.ok && json.available) {
        setUsernameStatus("available")
        setUsernameMsg("Username is available")
      } else {
        setUsernameStatus("taken")
        setUsernameMsg("Username is already taken")
      }
    } catch {
      setUsernameStatus("invalid")
      setUsernameMsg("Error checking username")
    }
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.toLowerCase()
    setUsername(v)
    setUsernameStatus("idle")
    setUsernameMsg("")
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => checkUsername(v), 400)
  }

  const handleUsernameBlur = () => {
    if (username) checkUsername(username)
  }

  // Google OAuth handler
  const signInWithOAuth = async () => {
    setIsOAuthLoading(true)
    setMessage(null)
    try {
      const redirectTo = process.env.NODE_ENV === "production"
        ? "https://v0-modern-trading-dashboard-liard.vercel.app/auth/callback"
        : "http://localhost:3000/auth/callback";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      })
      if (error) {
        setMessage({ type: "error", text: error.message })
        setIsOAuthLoading(false)
      }
      // On success, Supabase will redirect, so no need to set loading false here
    } catch (error) {
      setMessage({ type: "error", text: "Google sign-in failed. Please try again." })
      setIsOAuthLoading(false)
    }
  }

  // Google button (shared)
  const GoogleButton = (
    <Button
      type="button"
      variant="outline"
      className="w-full flex items-center justify-center mb-4"
      onClick={signInWithOAuth}
      disabled={isOAuthLoading || isLoading}
    >
      {isOAuthLoading ? (
        <span className="w-full flex items-center justify-center">Loading...</span>
      ) : (
        <>
          <GoogleIcon /> Continue with Google
        </>
      )}
    </Button>
  )

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center justify-center space-x-2 mb-8">
        <TrendingUp className="h-8 w-8 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">TradingJournal</h1>
      </div>

      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>Welcome back</CardTitle>
              <CardDescription>Enter your credentials to access your trading journal</CardDescription>
            </CardHeader>
            <CardContent>
              {GoogleButton}
              <form action={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      required
                      disabled={isLoading || isOAuthLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      required
                      disabled={isLoading || isOAuthLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </div>

                {message && (
                  <Alert
                    className={message.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}
                  >
                    <AlertDescription className={message.type === "error" ? "text-red-800" : "text-green-800"}>
                      {message.text}
                    </AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isLoading || isOAuthLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle>Create account</CardTitle>
              <CardDescription>Start your trading journey with a new account</CardDescription>
            </CardHeader>
            <CardContent>
              {GoogleButton}
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      className="pl-10"
                      required
                      disabled={isLoading || isOAuthLoading}
                      value={signupFullName}
                      onChange={(e) => setSignupFullName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signupEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signupEmail"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      required
                      disabled={isLoading || isOAuthLoading}
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signupPassword">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signupPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      className="pl-10 pr-10"
                      required
                      disabled={isLoading || isOAuthLoading}
                      minLength={6}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    minLength={3}
                    maxLength={15}
                    pattern="[a-z0-9]{3,15}"
                    placeholder="Choose a username (lowercase, 3-15 chars)"
                    onChange={handleUsernameChange}
                    onBlur={handleUsernameBlur}
                    required
                    autoComplete="off"
                    disabled={isLoading || isOAuthLoading}
                    className={usernameStatus === "taken" || usernameStatus === "invalid" ? "border-red-500" : usernameStatus === "available" ? "border-green-500" : ""}
                  />
                  {usernameMsg && (
                    <div className={`text-sm mt-1 ${usernameStatus === "taken" || usernameStatus === "invalid" ? "text-red-600" : "text-green-600"}`}>
                      {usernameMsg}
                    </div>
                  )}
                </div>

                {message && (
                  <Alert className={message.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
                    <AlertDescription className={message.type === "error" ? "text-red-800" : "text-green-800"}>
                      {message.text}
                    </AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isLoading || isOAuthLoading || usernameStatus === "taken" || usernameStatus === "invalid"}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
