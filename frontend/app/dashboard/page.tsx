import { getUserOrRedirect } from "@/lib/auth/getUserOrThrow"
import DashboardClient from "./dashboard-client"

export default async function DashboardPage() {
  // Server-side authentication check
  const user = await getUserOrRedirect('/dashboard')
  
  return <DashboardClient />
}