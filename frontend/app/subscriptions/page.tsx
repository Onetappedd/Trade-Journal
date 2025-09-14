"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import {
  CreditCard,
  Calendar,
  Check,
  Crown,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Star,
  Zap,
  Building2,
} from "lucide-react"

export default function SubscriptionsPage() {
  const [expandedFaq, setExpandedFaq] = React.useState<number | null>(null)

  const currentPlan = {
    name: "Professional",
    price: 29,
    billing: "monthly",
    renewalDate: "2024-02-15",
    status: "active",
  }

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: 0,
      billing: "monthly",
      description: "Perfect for beginners getting started with trade tracking",
      features: [
        "Up to 100 trades per month",
        "Basic performance analytics",
        "CSV import/export",
        "Email support",
        "Mobile app access",
      ],
      popular: false,
      current: false,
    },
    {
      id: "professional",
      name: "Professional",
      price: 29,
      billing: "monthly",
      description: "Advanced analytics and unlimited trading for serious traders",
      features: [
        "Unlimited trades",
        "Advanced performance analytics",
        "Risk management tools",
        "Real-time market data",
        "Priority support",
        "Custom reports",
        "API access",
        "Broker integrations",
      ],
      popular: true,
      current: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 99,
      billing: "monthly",
      description: "Complete solution for trading teams and institutions",
      features: [
        "Everything in Professional",
        "Team collaboration tools",
        "Advanced compliance reporting",
        "Custom integrations",
        "Dedicated account manager",
        "SLA guarantee",
        "White-label options",
        "Advanced security features",
      ],
      popular: false,
      current: false,
    },
  ]

  const faqs = [
    {
      question: "How does billing work?",
      answer:
        "You're billed monthly or annually depending on your chosen plan. All plans include a 14-day free trial for new users.",
    },
    {
      question: "Can I change my plan anytime?",
      answer:
        "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards (Visa, MasterCard, American Express) and PayPal. Enterprise customers can also pay via bank transfer.",
    },
    {
      question: "Is there a free trial?",
      answer: "Yes! All paid plans come with a 14-day free trial. No credit card required to start your trial.",
    },
    {
      question: "What happens if I cancel?",
      answer:
        "You can cancel anytime. Your account will remain active until the end of your current billing period, then automatically downgrade to the free Starter plan.",
    },
    {
      question: "Do you offer refunds?",
      answer:
        "We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact support for a full refund.",
    },
  ]

  const handleUpgrade = async (planId: string) => {
    try {
      // Get the session token
      const session = JSON.parse(localStorage.getItem('riskr-supabase-auth-v1') || '{}')
      const token = session?.access_token

      if (!token) {
        throw new Error('No authentication token found')
      }

      toast({
        title: "Redirecting to Checkout",
        description: "You'll be redirected to our secure payment processor.",
      })

      // Call the checkout API
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planId: planId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()
      
      // Redirect to Stripe checkout
      window.location.href = url
    } catch (error) {
      console.error('Error creating checkout session:', error)
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleManageBilling = async () => {
    try {
      // Get the session token
      const session = JSON.parse(localStorage.getItem('riskr-supabase-auth-v1') || '{}')
      const token = session?.access_token

      if (!token) {
        throw new Error('No authentication token found')
      }

      toast({
        title: "Opening Billing Portal",
        description: "Redirecting to Stripe customer portal...",
      })

      // Call the portal API
      const response = await fetch('/api/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to create portal session')
      }

      const { url } = await response.json()
      
      // Redirect to Stripe customer portal
      window.location.href = url
    } catch (error) {
      console.error('Error creating portal session:', error)
      toast({
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Subscription & Billing</h1>
              <p className="text-slate-400 text-sm sm:text-base">Manage your subscription and billing preferences</p>
            </div>
            <Badge className="bg-emerald-950/50 text-emerald-400 border-emerald-800/50 hidden sm:flex">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* Current Plan */}
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-white flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-emerald-400" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-2xl font-bold text-white">{currentPlan.name}</h3>
                        <Badge className="bg-emerald-950/50 text-emerald-400 border-emerald-800/50">
                          {currentPlan.status}
                        </Badge>
                      </div>
                      <p className="text-slate-400">
                        ${currentPlan.price}/{currentPlan.billing} • Renews on{" "}
                        {new Date(currentPlan.renewalDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-emerald-400">${currentPlan.price}</div>
                      <div className="text-sm text-slate-400">per month</div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleManageBilling}
                      variant="outline"
                      className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Manage Billing
                    </Button>
                    <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800">
                      <Calendar className="h-4 w-4 mr-2" />
                      View Billing History
                    </Button>
                  </div>
                </div>

                <div className="lg:border-l lg:border-slate-800/50 lg:pl-6">
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">Next Billing Date</h4>
                  <div className="text-lg font-semibold text-white mb-1">
                    {new Date(currentPlan.renewalDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <p className="text-sm text-slate-400">Auto-renewal enabled</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Plans */}
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl text-white text-center">Choose Your Plan</CardTitle>
              <p className="text-slate-400 text-center">Upgrade or downgrade your subscription anytime</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative rounded-xl border p-6 ${
                      plan.popular
                        ? "border-emerald-500/50 bg-emerald-950/20"
                        : plan.current
                          ? "border-emerald-800/50 bg-emerald-950/10"
                          : "border-slate-700/50 bg-slate-800/20"
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-emerald-600 text-white border-emerald-500">
                          <Star className="h-3 w-3 mr-1" />
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <div className="flex items-center justify-center mb-2">
                        {plan.id === "starter" && <Zap className="h-6 w-6 text-slate-400" />}
                        {plan.id === "professional" && <Crown className="h-6 w-6 text-emerald-400" />}
                        {plan.id === "enterprise" && <Building2 className="h-6 w-6 text-blue-400" />}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                      <p className="text-sm text-slate-400 mb-4">{plan.description}</p>
                      <div className="mb-4">
                        <span className="text-3xl font-bold text-white">${plan.price}</span>
                        <span className="text-slate-400">/{plan.billing}</span>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-slate-300">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={plan.current}
                      className={`w-full ${
                        plan.current
                          ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                          : plan.popular
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-600"
                      }`}
                    >
                      {plan.current ? "Current Plan" : plan.price === 0 ? "Downgrade" : "Upgrade"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-white flex items-center">
                <HelpCircle className="h-5 w-5 mr-2 text-emerald-400" />
                Billing FAQ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="border-b border-slate-800/50 last:border-b-0 pb-4 last:pb-0">
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                      className="w-full flex items-center justify-between text-left py-2 hover:text-emerald-400 transition-colors"
                    >
                      <span className="font-medium text-white">{faq.question}</span>
                      {expandedFaq === index ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                    {expandedFaq === index && (
                      <div className="mt-2 text-slate-400 text-sm leading-relaxed">{faq.answer}</div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
