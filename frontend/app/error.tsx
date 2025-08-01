"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">Something went wrong!</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">We encountered an unexpected error. Please try again.</p>
        <div className="space-y-2">
          <Button onClick={reset} className="w-full">
            Try again
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")} className="w-full">
            Go home
          </Button>
        </div>
        {error.digest && <p className="mt-4 text-xs text-gray-500">Error ID: {error.digest}</p>}
      </div>
    </div>
  )
}
