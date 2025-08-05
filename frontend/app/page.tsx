import { redirect } from "next/navigation"

// Force deployment update - build fix
export default function HomePage() {
  redirect("/dashboard")
}
