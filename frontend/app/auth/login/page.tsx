"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField, SubmitButton } from "@/components/form-field"
import { toast } from "@/hooks/use-toast"
import { BarChart3, Mail, Lock, Chrome } from "lucide-react"
import { useAuth } from "@/providers/auth-provider"

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { supabase } = useAuth()

  const validateField = (field: string, value: string) => {
    const errors: Record<string, string> = {}

    switch (field) {
      case "email":
        if (!value) {
          errors.email = "Email is required"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = "Please enter a valid email address"
        }
        break
      case "password":
        if (!value) {
          errors.password = "Password is required"
        }
        break
    }

    setFormErrors((prev) => ({ ...prev, ...errors }))
    return Object.keys(errors).length === 0
  }

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    const emailValid = validateField("email", formData.email)
    const passwordValid = validateField("password", formData.password)

    if (!emailValid || !passwordValid) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors below",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      if (!supabase) {
        throw new Error('Authentication service not available')
      }
      
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })
      
      if (error) {
        throw error
      }

      toast({
        title: "Login Successful",
        description: "Welcome back to RiskR!",
      })
      
      // Redirect to dashboard
      window.location.href = "/dashboard"
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsSubmitting(true)
    try {
      // TODO: Implement Google OAuth
      toast({
        title: "Google Login",
        description: "Google authentication is coming soon!",
      })
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: "Google authentication failed. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">RiskR</span>
          </div>
        </div>

        <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
            <p className="text-slate-400 mt-2">Sign in to your trading account</p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Google OAuth Button */}
            <Button
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              variant="outline"
              className="w-full h-12 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent"
            >
              <Chrome className="h-5 w-5 mr-3" />
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800/50" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-900/50 text-slate-400">or continue with email</span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                id="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={(value) => handleFieldChange("email", value)}
                onBlur={() => validateField("email", formData.email)}
                required
                error={formErrors.email}
                placeholder="Enter your email"
                icon={<Mail className="h-4 w-4" />}
              />

              <FormField
                id="password"
                label="Password"
                type="password"
                value={formData.password}
                onChange={(value) => handleFieldChange("password", value)}
                onBlur={() => validateField("password", formData.password)}
                required
                error={formErrors.password}
                placeholder="Enter your password"
                icon={<Lock className="h-4 w-4" />}
              />

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 text-slate-400">
                  <input
                    type="checkbox"
                    className="rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-slate-900"
                  />
                  <span>Remember me</span>
                </label>
                <Link href="/auth/reset" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                  Forgot password?
                </Link>
              </div>

              <SubmitButton
                type="submit"
                variant="primary"
                loading={isSubmitting}
                disabled={Object.keys(formErrors).some((key) => formErrors[key])}
                className="w-full h-12"
              >
                Sign In
              </SubmitButton>
            </form>

            {/* Sign Up Link */}
            <div className="text-center text-sm text-slate-400">
              Don't have an account?{" "}
              <Link
                href="/auth/signup"
                className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
