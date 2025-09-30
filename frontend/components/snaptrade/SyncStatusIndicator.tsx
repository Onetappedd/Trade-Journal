/**
 * Sync Status Indicator Component
 * Shows visual indicator of sync freshness with helpful context
 * 
 * Freshness levels:
 * - Fresh (< 6 hours): Green
 * - Recent (6-24 hours): Yellow
 * - Stale (24-72 hours): Orange
 * - Expired (> 72 hours): Red (loses verification)
 * 
 * Usage:
 * <SyncStatusIndicator 
 *   lastSync="2025-01-15T12:00:00Z"
 *   showText={true}
 *   size="md"
 * />
 */

"use client";

import { cn } from "@/lib/utils";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Clock, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

type SyncStatus = "fresh" | "recent" | "stale" | "expired" | "never";

interface SyncStatusIndicatorProps {
  lastSync?: string | null;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function SyncStatusIndicator({
  lastSync,
  showText = true,
  size = "md",
  className
}: SyncStatusIndicatorProps) {
  const getStatus = (): SyncStatus => {
    if (!lastSync) return "never";

    try {
      const syncDate = new Date(lastSync);
      const now = new Date();
      const diffHours = (now.getTime() - syncDate.getTime()) / (1000 * 60 * 60);

      if (diffHours < 6) return "fresh";
      if (diffHours < 24) return "recent";
      if (diffHours < 72) return "stale";
      return "expired";
    } catch {
      return "never";
    }
  };

  const formatTime = (): string => {
    if (!lastSync) return "Never synced";

    try {
      const syncDate = new Date(lastSync);
      const now = new Date();
      const diffMs = now.getTime() - syncDate.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffMinutes < 1) return "Just now";
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      
      return syncDate.toLocaleDateString();
    } catch {
      return "Unknown";
    }
  };

  const status = getStatus();
  const timeText = formatTime();

  const statusConfig = {
    fresh: {
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-500",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/20",
      label: "Fresh",
      description: "Data synced within last 6 hours"
    },
    recent: {
      icon: Clock,
      color: "text-blue-600 dark:text-blue-500",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      label: "Recent",
      description: "Data synced within last 24 hours"
    },
    stale: {
      icon: AlertTriangle,
      color: "text-amber-600 dark:text-amber-500",
      bgColor: "bg-amber-100 dark:bg-amber-900/20",
      label: "Stale",
      description: "Data synced within last 72 hours. Consider refreshing."
    },
    expired: {
      icon: XCircle,
      color: "text-red-600 dark:text-red-500",
      bgColor: "bg-red-100 dark:bg-red-900/20",
      label: "Expired",
      description: "Data not synced in over 72 hours. Verification lost."
    },
    never: {
      icon: XCircle,
      color: "text-gray-600 dark:text-gray-500",
      bgColor: "bg-gray-100 dark:bg-gray-900/20",
      label: "Never",
      description: "No sync data available"
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-1.5 cursor-help transition-colors",
              config.color,
              className
            )}
          >
            <Icon className={cn(sizeClasses[size], "flex-shrink-0")} />
            {showText && (
              <span className={cn("font-medium", textSizeClasses[size])}>
                {timeText}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center" className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={cn("rounded-full p-1", config.bgColor)}>
                <Icon className={cn("h-3 w-3", config.color)} />
              </div>
              <span className="font-semibold text-sm">
                {config.label} - {timeText}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {config.description}
            </p>
            {status === "stale" || status === "expired" ? (
              <p className="text-xs text-muted-foreground pt-1 border-t">
                💡 Tip: SnapTrade syncs daily. Manual refresh available.
              </p>
            ) : null}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Compact Sync Badge Version
 * Shows just the status badge without text
 */
export function SyncStatusBadge({
  lastSync,
  className
}: {
  lastSync?: string | null;
  className?: string;
}) {
  return (
    <SyncStatusIndicator
      lastSync={lastSync}
      showText={false}
      size="sm"
      className={className}
    />
  );
}
