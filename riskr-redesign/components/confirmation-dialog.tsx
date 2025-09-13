"use client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle, Trash2 } from "lucide-react"

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "destructive" | "warning"
  onConfirm: () => void
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
  onConfirm,
}: ConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-slate-900 border-slate-700">
        <AlertDialogHeader>
          <div className="flex items-center space-x-3">
            {variant === "destructive" ? (
              <div className="h-10 w-10 rounded-full bg-red-950/50 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-yellow-950/50 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
            )}
            <div>
              <AlertDialogTitle className="text-slate-100">{title}</AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="text-slate-400 mt-2">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              variant === "destructive"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-yellow-600 hover:bg-yellow-700 text-white"
            }
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
