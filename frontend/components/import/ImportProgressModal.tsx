"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Loader2, AlertCircle, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImportProgressModalProps {
  isOpen: boolean
  onClose: () => void
  totalTrades: number
  currentProgress: number
  status: "importing" | "success" | "error"
  successCount?: number
  errorCount?: number
  duplicateCount?: number
  errorMessage?: string
}

export function ImportProgressModal({
  isOpen,
  onClose,
  totalTrades,
  currentProgress,
  status,
  successCount = 0,
  errorCount = 0,
  duplicateCount = 0,
  errorMessage,
}: ImportProgressModalProps) {
  const [displayProgress, setDisplayProgress] = useState(0)

  // Smooth progress animation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (displayProgress < currentProgress) {
        setDisplayProgress(prev => Math.min(prev + 1, currentProgress))
      }
    }, 10)
    return () => clearTimeout(timer)
  }, [displayProgress, currentProgress])

  // Reset display progress when modal opens
  useEffect(() => {
    if (isOpen) {
      setDisplayProgress(0)
    }
  }, [isOpen])

  const getStatusIcon = () => {
    switch (status) {
      case "importing":
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      case "success":
        return <CheckCircle2 className="h-8 w-8 text-green-500" />
      case "error":
        return <AlertCircle className="h-8 w-8 text-red-500" />
    }
  }

  const getStatusMessage = () => {
    switch (status) {
      case "importing":
        return `Importing ${Math.floor((currentProgress / 100) * totalTrades)} of ${totalTrades} trades...`
      case "success":
        return "Import completed successfully!"
      case "error":
        return errorMessage || "Import failed. Please try again."
    }
  }

  const getProgressBarColor = () => {
    switch (status) {
      case "importing":
        return "bg-blue-500"
      case "success":
        return "bg-green-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-blue-500"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={status !== "importing" ? onClose : undefined}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => status === "importing" && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {status === "importing" ? "Importing Trades" : status === "success" ? "Import Complete" : "Import Failed"}
          </DialogTitle>
          <DialogDescription>
            {status === "importing" && "Please wait while we process your trades..."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Status Icon */}
          <div className="flex justify-center">
            {getStatusIcon()}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{displayProgress}%</span>
            </div>
            <Progress 
              value={displayProgress} 
              className="h-2"
              indicatorClassName={cn("transition-all duration-300", getProgressBarColor())}
            />
          </div>

          {/* Status Message */}
          <div className="text-center">
            <p className="text-sm font-medium">{getStatusMessage()}</p>
            {status === "importing" && (
              <p className="text-xs text-muted-foreground mt-1">
                This may take a few moments...
              </p>
            )}
          </div>

          {/* Import Summary */}
          {status !== "importing" && (
            <div className="border rounded-lg p-4 space-y-2 bg-muted/50">
              <h4 className="text-sm font-semibold">Import Summary</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Successful</p>
                  <p className="font-semibold text-green-600">{successCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duplicates</p>
                  <p className="font-semibold text-yellow-600">{duplicateCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Failed</p>
                  <p className="font-semibold text-red-600">{errorCount}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {status !== "importing" && (
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  status === "success"
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {status === "success" ? "Done" : "Close"}
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}