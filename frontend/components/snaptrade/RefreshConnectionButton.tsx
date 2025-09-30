/**
 * Refresh Connection Button Component
 * Triggers manual refresh of broker connection data
 * 
 * ⚠️ WARNING: May incur per-refresh cost on pay-as-you-go pricing
 * Shows warning dialog before refresh
 * 
 * Usage:
 * <RefreshConnectionButton 
 *   userId={user.id}
 *   authorizationId="auth-uuid"
 *   onSuccess={() => refetchData()}
 * />
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RefreshConnectionButtonProps {
  userId: string;
  authorizationId: string;
  brokerName?: string;
  lastSync?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showWarning?: boolean; // Show cost warning dialog
  className?: string;
}

export default function RefreshConnectionButton({
  userId,
  authorizationId,
  brokerName = "broker",
  lastSync,
  onSuccess,
  onError,
  variant = "ghost",
  size = "sm",
  showWarning = true,
  className
}: RefreshConnectionButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const getTimeSinceSync = () => {
    if (!lastSync) return "Never synced";
    
    try {
      const syncDate = new Date(lastSync);
      const now = new Date();
      const diffMs = now.getTime() - syncDate.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (diffMinutes < 1) return "Just now";
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return "Unknown";
    }
  };

  const shouldShowWarning = () => {
    if (!lastSync) return true; // Never synced, safe to refresh
    
    try {
      const syncDate = new Date(lastSync);
      const now = new Date();
      const diffHours = (now.getTime() - syncDate.getTime()) / (1000 * 60 * 60);
      
      // Show warning if last sync was less than 1 hour ago
      return diffHours < 1;
    } catch {
      return true;
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/snaptrade/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          riskrUserId: userId,
          authorizationId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || "Refresh failed");
      }

      const { message } = await response.json();

      toast.success("Refresh initiated", {
        description: message || "Your data will update in a few moments"
      });

      // Wait a moment then call onSuccess to refetch data
      setTimeout(() => {
        onSuccess?.();
        setLoading(false);
      }, 2000);

    } catch (error: any) {
      toast.error("Refresh failed", {
        description: error.message
      });
      onError?.(error.message);
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (showWarning && shouldShowWarning()) {
      setShowDialog(true);
    } else {
      handleRefresh();
    }
  };

  const timeSinceSync = getTimeSinceSync();
  const isRecentSync = shouldShowWarning();

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={loading}
        variant={variant}
        size={size}
        className={cn(
          className,
          loading && "cursor-wait"
        )}
        title={`Last synced: ${timeSinceSync}`}
      >
        <RefreshCw 
          className={cn(
            "h-4 w-4",
            loading && "animate-spin",
            size !== "icon" && "mr-2"
          )} 
        />
        {size !== "icon" && (loading ? "Refreshing..." : "Refresh")}
      </Button>

      {showWarning && (
        <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Refresh Connection?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>
                  You're about to manually refresh your <strong>{brokerName}</strong> connection.
                </p>
                
                {isRecentSync && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <p className="text-sm text-amber-900 dark:text-amber-200">
                      <strong>Note:</strong> This connection was synced {timeSinceSync}. 
                      SnapTrade automatically syncs daily.
                    </p>
                  </div>
                )}

                <div className="bg-muted rounded-lg p-3 space-y-2">
                  <p className="text-sm font-medium">What happens:</p>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>SnapTrade pulls fresh data from your broker</li>
                    <li>Your positions and balances update</li>
                    <li>You'll receive an update in a few moments</li>
                  </ul>
                </div>

                {showWarning && (
                  <p className="text-xs text-muted-foreground">
                    ⚠️ Manual refreshes may incur costs on pay-as-you-go pricing plans.
                  </p>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  setShowDialog(false);
                  handleRefresh();
                }}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh Now"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
