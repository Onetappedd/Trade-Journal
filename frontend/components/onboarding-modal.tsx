"use client"

import type React from "react"
import { FormField, FormActions, SubmitButton } from "@/components/form-field"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, User, TrendingUp, FileText, Camera, Building2 } from "lucide-react"
import { showNotification } from "@/lib/notifications"

const ONBOARDING_STORAGE_KEY = "riskr-onboarding-completed"

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [profileData, setProfileData] = useState({
    username: "",
    profilePicture: null as File | null,
    profilePictureUrl: "",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalSteps = 3
  const progress = (currentStep / totalSteps) * 100

  const handleNext = async () => {
    if (currentStep === 1 && !profileData.username) {
      setFormErrors({ username: "Username is required" })
      return
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      setIsSubmitting(true)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      handleFinish()
    }
  }

  const handleSkip = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      handleFinish()
    }
  }

  const handleFinish = () => {
    console.log("[v0] handleFinish called")
    console.log("[v0] showNotification object:", showNotification)
    console.log("[v0] showNotification.success type:", typeof showNotification.success)

    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true")

    try {
      showNotification.success("Welcome to RiskR! Your account is ready to go.")
      console.log("[v0] Notification sent successfully")
    } catch (error) {
      console.log("[v0] Notification error:", error)
    }

    setIsSubmitting(false)
    onClose()
  }

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setProfileData((prev) => ({ ...prev, profilePicture: file }))
      const url = URL.createObjectURL(file)
      setProfileData((prev) => ({ ...prev, profilePictureUrl: url }))
    }
  }

  const validateUsername = (username: string) => {
    if (username.length < 3) {
      setFormErrors((prev) => ({ ...prev, username: "Username must be at least 3 characters" }))
    } else {
      setFormErrors((prev) => ({ ...prev, username: "" }))
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <User className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Set up your profile</h3>
              <p className="text-slate-400 text-sm">Let's personalize your RiskR experience</p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profileData.profilePictureUrl || "/placeholder.svg"} />
                    <AvatarFallback className="bg-slate-700 text-slate-300">
                      {profileData.username.slice(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="profile-picture"
                    className="absolute -bottom-2 -right-2 bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-full cursor-pointer transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                    <input
                      id="profile-picture"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePictureChange}
                    />
                  </label>
                </div>
                <p className="text-xs text-slate-400">Click the camera to upload a profile picture</p>
              </div>

              <FormField
                id="username"
                label="Username"
                value={profileData.username}
                onChange={(value) => {
                  setProfileData((prev) => ({ ...prev, username: value }))
                  if (formErrors.username) {
                    setFormErrors((prev) => ({ ...prev, username: "" }))
                  }
                }}
                onBlur={() => validateUsername(profileData.username)}
                placeholder="Enter your username"
                required
                error={formErrors.username}
                helperText="This will be your public display name"
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <TrendingUp className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Connect your trading data</h3>
              <p className="text-slate-400 text-sm">Import your trades to start tracking performance</p>
            </div>

            <div className="grid gap-4">
              <Card className="bg-slate-800 border-slate-700 hover:border-emerald-500/50 transition-colors cursor-pointer">
                <CardHeader className="pb-3">
                  <CardTitle className="text-slate-100 flex items-center gap-2">
                    <Upload className="h-5 w-5 text-emerald-500" />
                    Upload CSV File
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Import trades from your broker statements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                  >
                    Choose File
                  </Button>
                </CardContent>
              </Card>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900 px-2 text-slate-500">Or</span>
                </div>
              </div>

              <Card className="bg-slate-800 border-slate-700 hover:border-emerald-500/50 transition-colors cursor-pointer">
                <CardHeader className="pb-3">
                  <CardTitle className="text-slate-100 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-emerald-500" />
                    Connect Broker
                  </CardTitle>
                  <CardDescription className="text-slate-400">Link your brokerage account directly</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                    >
                      Robinhood
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                    >
                      Webull
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                    >
                      Schwab
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                    >
                      IBKR
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Add your first trade note</h3>
              <p className="text-slate-400 text-sm">Document your trading strategy and thoughts</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trade-symbol" className="text-slate-300">
                  Trade Symbol
                </Label>
                <Input
                  id="trade-symbol"
                  placeholder="e.g., AAPL, TSLA, SPY"
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trade-note" className="text-slate-300">
                  Trade Note
                </Label>
                <Textarea
                  id="trade-note"
                  placeholder="Why did you make this trade? What's your strategy?"
                  className="bg-slate-800 border-slate-700 text-slate-100 min-h-[100px]"
                />
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-2">💡 Pro tip:</p>
                <p className="text-sm text-slate-300">
                  Great trade notes include your entry/exit strategy, risk management plan, and market analysis. This
                  helps you learn from both wins and losses.
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-slate-100 text-center">Welcome to RiskR</DialogTitle>
          <div className="space-y-2">
            <div className="flex justify-center space-x-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full ${step <= currentStep ? "bg-emerald-500" : "bg-slate-600"}`}
                />
              ))}
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-center text-sm text-slate-400">
              Step {currentStep} of {totalSteps}
            </p>
          </div>
        </DialogHeader>

        <div className="py-4">{renderStep()}</div>

        <FormActions className="pt-4 border-t-0">
          <SubmitButton variant="secondary" onClick={handleSkip}>
            Skip
          </SubmitButton>
          <SubmitButton
            variant="primary"
            onClick={handleNext}
            loading={isSubmitting}
            disabled={currentStep === 1 && !profileData.username}
          >
            {currentStep === totalSteps ? "Finish" : "Next"}
          </SubmitButton>
        </FormActions>
      </DialogContent>
    </Dialog>
  )
}

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY)
    if (!completed) {
      // Small delay to ensure the page has loaded
      const timer = setTimeout(() => {
        setShowOnboarding(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const closeOnboarding = () => {
    setShowOnboarding(false)
  }

  return { showOnboarding, closeOnboarding }
}
