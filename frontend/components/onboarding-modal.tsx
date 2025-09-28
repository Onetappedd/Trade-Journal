"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ArrowRight, Target, BarChart3, Shield } from "lucide-react"

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
}

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false)

  const closeOnboarding = () => {
    setShowOnboarding(false)
    // Mark user as onboarded in localStorage
    localStorage.setItem('onboarded', 'true')
  }

  useEffect(() => {
    // Check if user has been onboarded
    const onboarded = localStorage.getItem('onboarded')
    if (!onboarded) {
      setShowOnboarding(true)
    }
  }, [])

  return { showOnboarding, closeOnboarding }
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: "Welcome to Riskr",
      description: "Your professional trading analytics platform",
      icon: <Target className="h-8 w-8 text-emerald-400" />,
      content: "Get started with comprehensive trade analysis and portfolio tracking."
    },
    {
      title: "Import Your Trades",
      description: "Connect your broker or upload CSV files",
      icon: <BarChart3 className="h-8 w-8 text-blue-400" />,
      content: "Import your trading history from any broker with our smart mapping system."
    },
    {
      title: "Analyze Performance",
      description: "Track your progress with advanced metrics",
      icon: <Shield className="h-8 w-8 text-purple-400" />,
      content: "Monitor your win rate, risk metrics, and portfolio performance in real-time."
    }
  ]

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onClose()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Welcome to Riskr</DialogTitle>
          <DialogDescription className="text-slate-400">
            Let's get you started with your trading analytics platform
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-8 rounded-full ${
                  index <= currentStep ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Current Step Content */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {steps[currentStep].icon}
              </div>
              <CardTitle className="text-xl text-white">
                {steps[currentStep].title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-slate-300 text-lg">
                {steps[currentStep].description}
              </p>
              <p className="text-slate-400">
                {steps[currentStep].content}
              </p>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Previous
            </Button>
            
            <div className="flex space-x-2">
              {currentStep === steps.length - 1 ? (
                <Button
                  onClick={onClose}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Get Started
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}