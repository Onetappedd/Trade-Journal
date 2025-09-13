"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionHref, onAction }: EmptyStateProps) {
  return (
    <Card className="bg-slate-900/50 border-slate-800/50">
      <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <div className="h-16 w-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-6">
          <Icon className="h-8 w-8 text-slate-400" />
        </div>

        <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
        <p className="text-slate-400 mb-8 max-w-md leading-relaxed">{description}</p>

        {actionLabel && (actionHref || onAction) && (
          <>
            {actionHref ? (
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Link href={actionHref}>{actionLabel}</Link>
              </Button>
            ) : (
              <Button onClick={onAction} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {actionLabel}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
