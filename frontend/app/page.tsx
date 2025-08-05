import { redirect } from "next/navigation"

// Redirect to dashboard - route.ts removed to fix build conflict
export default function HomePage() {
  redirect("/dashboard")
}
