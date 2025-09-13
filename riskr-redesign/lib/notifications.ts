console.log("[v0] Loading notifications library")

import { toast } from "sonner"

console.log("[v0] Toast imported:", typeof toast)

export const showNotification = {
  success: (message: string) => {
    console.log("[v0] showNotification.success called with:", message)
    console.log("[v0] toast function:", typeof toast)
    toast.success(message)
  },
  error: (message: string) => {
    console.log("[v0] showNotification.error called with:", message)
    toast.error(message)
  },
  info: (message: string) => {
    console.log("[v0] showNotification.info called with:", message)
    toast.info(message)
  },
  warning: (message: string) => {
    console.log("[v0] showNotification.warning called with:", message)
    toast.warning(message)
  },
}

console.log("[v0] showNotification object created:", showNotification)
