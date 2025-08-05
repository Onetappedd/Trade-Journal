import type { Metadata } from "next"
import { CalendarPage } from "@/components/calendar-page"

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Calendar | Trading Journal",
  description: "View your trading activity in calendar format",
}

export default function CalendarView() {
  return <CalendarPage />
}
