"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Home, RefreshCw, TrendingUp, AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("[v0] Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <CardContent className="p-8 text-center space-y-6">
          {/* Logo/Brand */}
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">RiskR</span>
          </div>

          {/* Error Message */}
          <div className="space-y-2">
            <div className="h-12 w-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Something went wrong</h1>
            <p className="text-slate-600 dark:text-slate-400">
              We encountered an unexpected error. Please try again or contact support if the problem persists.
            </p>
            {error.digest && (
              <p className="text-xs text-slate-500 dark:text-slate-500 font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded">
                Error ID: {error.digest}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button onClick={reset} className="flex-1 bg-emerald-500 hover:bg-emerald-600">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" asChild className="flex-1 bg-transparent">
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
