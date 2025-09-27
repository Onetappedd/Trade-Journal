import { getUserOrRedirect } from "@/lib/auth/getUserOrThrow"
import SettingsPageClient from "./settings-client"

export default async function SettingsPage() {
  // Server-side authentication check
  const user = await getUserOrRedirect('/settings')
  
  return <SettingsPageClient />
}