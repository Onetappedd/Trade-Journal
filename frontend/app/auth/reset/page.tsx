"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField, SubmitButton } from "@/components/form-field"
import { toast } from "@/hooks/use-toast"
import { BarChart3, Mail, ArrowLeft, CheckCircle } from "lucide-react"
import { useAuth } from "@/providers/auth-provider"

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState({
    email: "",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
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

    // Validate email field
    const emailValid = validateField("email", formData.email)

    if (!emailValid) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      if (!supabase) {
        throw new Error('Authentication service not available')
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email)
      
      if (error) {
        throw error
      }

      setEmailSent(true)
      toast({
        title: "Reset Email Sent",
        description: "Check your inbox for password reset instructions.",
      })
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.message || "Unable to send reset email. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendEmail = async () => {
    setIsSubmitting(true)
    try {
      if (!supabase) {
        throw new Error('Authentication service not available')
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email)
      
      if (error) {
        throw error
      }

      toast({
        title: "Email Resent",
        description: "Password reset email has been sent again.",
      })
    } catch (error: any) {
      toast({
        title: "Resend Failed",
        description: error.message || "Unable to resend email. Please try again.",
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
            <CardTitle className="text-2xl font-bold text-white">
              {emailSent ? "Check Your Email" : "Reset Password"}
            </CardTitle>
            <p className="text-slate-400 mt-2">
              {emailSent
                ? "We've sent password reset instructions to your email"
                : "Enter your email to receive reset instructions"}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {emailSent ? (
              // Success State
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="h-16 w-16 bg-emerald-950/50 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-emerald-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-slate-300">We've sent a password reset link to:</p>
                  <p className="text-emerald-400 font-medium">{formData.email}</p>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-slate-400">
                    Didn't receive the email? Check your spam folder or try again.
                  </p>

                  <Button
                    onClick={handleResendEmail}
                    disabled={isSubmitting}
                    variant="outline"
                    className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent"
                  >
                    Resend Email
                  </Button>
                </div>
              </div>
            ) : (
              // Reset Form
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormField
                  id="email"
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(value) => handleFieldChange("email", value)}
                  onBlur={() => validateField("email", formData.email)}
                  required
                  error={formErrors.email}
                  placeholder="Enter your email address"
                  helperText="We'll send reset instructions to this email"
                />

                <SubmitButton
                  type="submit"
                  variant="primary"
                  loading={isSubmitting}
                  disabled={Object.keys(formErrors).some((key) => formErrors[key])}
                  className="w-full h-12"
                >
                  Send Reset Instructions
                </SubmitButton>
              </form>
            )}

            {/* Back to Login */}
            <div className="text-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center text-sm text-slate-400 hover:text-emerald-400 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
