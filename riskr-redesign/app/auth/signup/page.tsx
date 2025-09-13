"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField, SubmitButton } from "@/components/form-field"
import { showSuccess, showError } from "@/lib/notifications"
import { BarChart3, User, Mail, Lock, Chrome } from "lucide-react"

export default function SignupPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateField = (field: string, value: string | boolean) => {
    const errors: Record<string, string> = {}

    switch (field) {
      case "username":
        if (!value) {
          errors.username = "Username is required"
        } else if (typeof value === "string" && value.length < 3) {
          errors.username = "Username must be at least 3 characters"
        } else if (typeof value === "string" && !/^[a-zA-Z0-9_]+$/.test(value)) {
          errors.username = "Username can only contain letters, numbers, and underscores"
        }
        break
      case "email":
        if (!value) {
          errors.email = "Email is required"
        } else if (typeof value === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = "Please enter a valid email address"
        }
        break
      case "password":
        if (!value) {
          errors.password = "Password is required"
        } else if (typeof value === "string" && value.length < 8) {
          errors.password = "Password must be at least 8 characters"
        } else if (typeof value === "string" && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          errors.password = "Password must contain uppercase, lowercase, and number"
        }
        break
      case "confirmPassword":
        if (!value) {
          errors.confirmPassword = "Please confirm your password"
        } else if (value !== formData.password) {
          errors.confirmPassword = "Passwords do not match"
        }
        break
      case "acceptTerms":
        if (!value) {
          errors.acceptTerms = "You must accept the terms and conditions"
        }
        break
    }

    setFormErrors((prev) => ({ ...prev, ...errors }))
    return Object.keys(errors).length === 0
  }

  const handleFieldChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    const usernameValid = validateField("username", formData.username)
    const emailValid = validateField("email", formData.email)
    const passwordValid = validateField("password", formData.password)
    const confirmPasswordValid = validateField("confirmPassword", formData.confirmPassword)
    const termsValid = validateField("acceptTerms", formData.acceptTerms)

    if (!usernameValid || !emailValid || !passwordValid || !confirmPasswordValid || !termsValid) {
      showError("Validation Error", "Please fix the errors below")
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))
      showSuccess("Account Created", "Welcome to RiskR! Please check your email to verify your account.")
      // Redirect to login or dashboard
      window.location.href = "/auth/login"
    } catch (error) {
      showError("Signup Failed", "An account with this email already exists.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignup = async () => {
    setIsSubmitting(true)
    try {
      // Simulate OAuth flow
      await new Promise((resolve) => setTimeout(resolve, 1500))
      showSuccess("Account Created", "Welcome to RiskR!")
      window.location.href = "/dashboard"
    } catch (error) {
      showError("Signup Failed", "Google authentication failed. Please try again.")
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
            <CardTitle className="text-2xl font-bold text-white">Create Account</CardTitle>
            <p className="text-slate-400 mt-2">Start your trading journey with RiskR</p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Google OAuth Button */}
            <Button
              onClick={handleGoogleSignup}
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
                <span className="px-4 bg-slate-900/50 text-slate-400">or create with email</span>
              </div>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                id="username"
                label="Username"
                type="text"
                value={formData.username}
                onChange={(value) => handleFieldChange("username", value)}
                onBlur={() => validateField("username", formData.username)}
                required
                error={formErrors.username}
                placeholder="Choose a username"
                helperText="Letters, numbers, and underscores only"
                icon={<User className="h-4 w-4" />}
              />

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
                placeholder="Create a password"
                helperText="At least 8 characters with uppercase, lowercase, and number"
                icon={<Lock className="h-4 w-4" />}
              />

              <FormField
                id="confirmPassword"
                label="Confirm Password"
                type="password"
                value={formData.confirmPassword}
                onChange={(value) => handleFieldChange("confirmPassword", value)}
                onBlur={() => validateField("confirmPassword", formData.confirmPassword)}
                required
                error={formErrors.confirmPassword}
                placeholder="Confirm your password"
                icon={<Lock className="h-4 w-4" />}
              />

              {/* Terms Checkbox */}
              <div className="space-y-2">
                <label className="flex items-start space-x-3 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={(e) => handleFieldChange("acceptTerms", e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-slate-900"
                  />
                  <span className="text-slate-400 leading-relaxed">
                    I agree to the{" "}
                    <Link href="/terms" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
                {formErrors.acceptTerms && <p className="text-red-400 text-sm">{formErrors.acceptTerms}</p>}
              </div>

              <SubmitButton
                type="submit"
                variant="primary"
                loading={isSubmitting}
                disabled={Object.keys(formErrors).some((key) => formErrors[key])}
                className="w-full h-12"
              >
                Create Account
              </SubmitButton>
            </form>

            {/* Sign In Link */}
            <div className="text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
