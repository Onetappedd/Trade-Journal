import { redirect } from "next/navigation"

// Route group solution - old dashboard page neutralized
export default function HomePage() {
  redirect("/dashboard")
}
