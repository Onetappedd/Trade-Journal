import { redirect } from "next/navigation"

// Force deployment update
export default function HomePage() {
  redirect("/dashboard")
}
