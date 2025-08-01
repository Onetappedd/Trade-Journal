import type { Metadata } from "next"
import { CalendarPage } from "@/components/calendar-page"

export const metadata: Metadata = {
  title: "Calendar | Trading Journal",
  description: "View your trading activity in calendar format",
}

export default function CalendarView() {
  return <CalendarPage />
}
