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
    <div className="flex min-h-screen flex-col items-center justify-center space-y-4">
      <div className="flex flex-col items-center space-y-2">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <h2 className="text-xl font-semibold">Something went wrong!</h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
      </div>
      <div className="flex space-x-2">
        <Button onClick={reset} variant="default">
          Try again
        </Button>
        <Button onClick={() => (window.location.href = "/")} variant="outline">
          Go home
        </Button>
      </div>
    </div>
  )
}
