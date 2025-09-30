"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react"

interface WebhookStatusChipProps {
  status: "healthy" | "error" | "warning"
  lastUpdate?: string
}

export function WebhookStatusChip({ status, lastUpdate }: WebhookStatusChipProps) {
  const config = {
    healthy: {
      icon: CheckCircle2,
      label: "Webhooks Active",
      className: "bg-emerald-950/50 text-emerald-400 border-emerald-800/50",
    },
    error: {
      icon: XCircle,
      label: "Webhooks Error",
      className: "bg-red-950/50 text-red-400 border-red-800/50",
    },
    warning: {
      icon: AlertCircle,
      label: "Webhooks Warning",
      className: "bg-yellow-950/50 text-yellow-400 border-yellow-800/50",
    },
  }

  const { icon: Icon, label, className } = config[status]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={className}>
            <Icon className="h-3 w-3 mr-1" />
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {lastUpdate ? `Last update: ${lastUpdate}` : "Webhook status"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
