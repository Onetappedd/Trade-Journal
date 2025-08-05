"use client"

import { SettingsSidebar } from "@/components/settings/SettingsSidebar"
import { SettingsContent } from "@/components/settings/SettingsContent"
import { useState } from "react"

export type SettingsSection = "profile" | "trading" | "notifications" | "integrations" | "billing"

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account and trading preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 flex-shrink-0">
          <SettingsSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
        </div>
        <div className="flex-1">
          <SettingsContent activeSection={activeSection} />
        </div>
      </div>
    </div>
  )
}
