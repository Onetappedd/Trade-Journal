"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, RefreshCw, Copy, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface NetworkErrorBannerProps {
  message?: string
  errorId?: string
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

export function NetworkErrorBanner({
  message = "Network error occurred. Please check your connection and try again.",
  errorId,
  onRetry,
  onDismiss,
  className = "",
}: NetworkErrorBannerProps) {
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = async () => {
    if (!onRetry) return

    setIsRetrying(true)
    try {
      await onRetry()
      toast({
        title: "Success",
        description: "Retry successful",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Retry failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRetrying(false)
    }
  }

  const handleCopyErrorId = () => {
    if (!errorId) return

    navigator.clipboard.writeText(errorId)
    toast({
      title: "Success",
      description: "Error ID copied to clipboard",
      variant: "default",
    })
  }

  return (
    <Alert className={`border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex-1 pr-4">
          <p className="text-red-800 dark:text-red-200 font-medium">{message}</p>
          {errorId && <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-mono">Error ID: {errorId}</p>}
        </div>

        <div className="flex items-center space-x-2">
          {errorId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyErrorId}
              className="h-8 px-2 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 bg-transparent"
            >
              <Copy className="h-3 w-3" />
              <span className="sr-only">Copy error ID</span>
            </Button>
          )}

          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={isRetrying}
              className="h-8 px-3 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 bg-transparent"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isRetrying ? "animate-spin" : ""}`} />
              {isRetrying ? "Retrying..." : "Retry"}
            </Button>
          )}

          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Dismiss</span>
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
