"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { User, TrendingUp, Bell, Link, CreditCard } from "lucide-react"
import type { SettingsSection } from "@/app/dashboard/settings/page"

interface SettingsSidebarProps {
  activeSection: SettingsSection
  setActiveSection: (section: SettingsSection) => void
}

const sections = [
  { id: "profile" as const, label: "Profile", icon: User },
  { id: "trading" as const, label: "Trading", icon: TrendingUp },
  { id: "notifications" as const, label: "Notifications", icon: Bell },
  { id: "integrations" as const, label: "Integrations", icon: Link },
  { id: "billing" as const, label: "Billing", icon: CreditCard },
]

export function SettingsSidebar({ activeSection, setActiveSection }: SettingsSidebarProps) {
  return (
    <Card className="p-4">
      <nav className="space-y-2">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <Button
              key={section.id}
              variant={activeSection === section.id ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveSection(section.id)}
            >
              <Icon className="mr-2 h-4 w-4" />
              {section.label}
            </Button>
          )
        })}
      </nav>
    </Card>
  )
}
