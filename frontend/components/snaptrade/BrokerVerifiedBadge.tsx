/**
 * Broker-Verified Badge Component
 * Displays a green shield check badge for users with verified broker connections
 * Shows tooltip with broker details on hover
 * 
 * Verification Logic:
 * - At least one active connection (disabled = false)
 * - Holdings synced within last 72 hours
 * - Determined by user_broker_verification view
 * 
 * Usage:
 * <BrokerVerifiedBadge 
 *   verified={true} 
 *   lastSync="2025-01-15T12:00:00Z"
 *   brokers={["Robinhood", "Schwab"]}
 * />
 */

"use client";

import { ShieldCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface BrokerVerifiedBadgeProps {
  verified: boolean;
  lastSync?: string;
  brokers?: string[];
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function BrokerVerifiedBadge({
  verified,
  lastSync,
  brokers = [],
  showLabel = true,
  size = "md",
  className
}: BrokerVerifiedBadgeProps) {
  // Don't show badge if not verified
  if (!verified) return null;

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

  const formatLastSync = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

      if (diffHours < 1) return "Just now";
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffHours < 72) return `${Math.floor(diffHours / 24)}d ago`;
      return date.toLocaleDateString();
    } catch {
      return "Unknown";
    }
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-1.5",
              "text-emerald-600 dark:text-emerald-500",
              "cursor-help transition-colors hover:text-emerald-700 dark:hover:text-emerald-400",
              className
            )}
          >
            <ShieldCheck 
              className={cn(sizeClasses[size], "flex-shrink-0")} 
              aria-hidden="true"
            />
            {showLabel && (
              <span className={cn("font-medium", textSizeClasses[size])}>
                Verified
              </span>
            )}
            <span className="sr-only">Broker verified via SnapTrade</span>
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          align="center"
          className="w-72 p-4"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
              <span className="font-semibold text-sm">Verified via SnapTrade</span>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              {brokers.length > 0 && (
                <div>
                  <span className="font-medium">Connected brokers:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {brokers.map((broker, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                      >
                        {broker}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {lastSync && (
                <div className="pt-1">
                  <span className="font-medium">Last sync:</span> {formatLastSync(lastSync)}
                </div>
              )}
              
              <div className="pt-2 text-xs opacity-70">
                Read-only access • Click to manage connections
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Hook to fetch broker verification status
 */
export function useBrokerVerification(userId: string | null) {
  const [data, setData] = React.useState<{
    verified: boolean;
    lastSync?: string;
    brokers: string[];
  }>({
    verified: false,
    brokers: []
  });

  React.useEffect(() => {
    if (!userId) return;

    const fetchVerification = async () => {
      try {
        // Fetch verification status from view
        const response = await fetch(`/api/snaptrade/verification?userId=${userId}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch broker verification:', error);
      }
    };

    fetchVerification();
  }, [userId]);

  return data;
}

// Named export for React import
import * as React from "react";
