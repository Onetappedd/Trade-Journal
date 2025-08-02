"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "./enhanced-auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export function EnhancedLoginForm() {
  const [signInData, setSignInData] = useState({ email: "", password: "" })
  const [signUpData, setSignUpData] = useState({ email: "", password: "", name: "" })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const result = await signIn(signInData.email, signInData.password)

    if (result.success) {
      router.push("/dashboard")
    } else {
      setError(result.error || "Sign in failed")
    }
    setIsLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const result = await signUp(signUpData.email, signUpData.password, signUpData.name)

    if (result.success) {
      router.push("/dashboard")
    } else {
      setError(result.error || "Sign up failed")
    }
    setIsLoading(false)
  }

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Trading Journal</CardTitle>
        <CardDescription>Sign in to your account or create a new one</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="demo@example.com"
                  value={signInData.email}
                  onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="password"
                  value={signInData.password}
                  onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                  required
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Your name"
                  value={signUpData.name}
                  onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="your@email.com"
                  value={signUpData.email}
                  onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Create a password"
                  value={signUpData.password}
                  onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                  required
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign Up
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="mt-4 text-sm text-muted-foreground text-center">
          Demo credentials: demo@example.com / password
        </div>
      </CardContent>
    </Card>
  )
}
