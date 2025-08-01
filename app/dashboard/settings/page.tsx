import type { Metadata } from "next"
import { SettingsPage } from "@/components/settings-page"

export const metadata: Metadata = {
  title: "Settings | Trading Journal",
  description: "Manage your account settings and preferences",
}

export default function Settings() {
  return <SettingsPage />
}
