/**
 * Connect Broker Button Component
 * Opens SnapTrade connection portal in new window and handles success/error messages
 * 
 * Usage:
 * <ConnectBrokerButton userId={user.id} onSuccess={() => refetchConnections()} />
 */

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield } from "lucide-react";

interface ConnectBrokerButtonProps {
  userId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export default function ConnectBrokerButton({
  userId,
  onSuccess,
  onError,
  variant = "default",
  size = "default",
  className
}: ConnectBrokerButtonProps) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Listen for window messages from SnapTrade portal
    const handler = (e: MessageEvent) => {
      const data = e.data;

      if (data?.status === "SUCCESS") {
        toast.success("Broker connected successfully!", {
          description: `Authorization ID: ${data.authorizationId}`
        });

        // Sync data after successful connection
        syncConnectionData().then(() => {
          onSuccess?.();
        });
      }

      if (data?.status === "ERROR") {
        const errorMessage = data.error || "Failed to connect broker";
        toast.error("Connection failed", {
          description: errorMessage
        });
        onError?.(errorMessage);
        setLoading(false);
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSuccess, onError]);

  const syncConnectionData = async () => {
    try {
      const response = await fetch("/api/snaptrade/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riskrUserId: userId })
      });

      if (!response.ok) {
        throw new Error("Failed to sync connection data");
      }

      const { connections, accounts } = await response.json();
      toast.success("Data synced", {
        description: `${connections} connections, ${accounts} accounts`
      });
      
      setLoading(false);
    } catch (error: any) {
      toast.error("Sync failed", {
        description: error.message
      });
      setLoading(false);
    }
  };

  const openPortal = async () => {
    try {
      setLoading(true);

      // 1. Register user if not already registered
      await fetch("/api/snaptrade/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riskrUserId: userId })
      });

      // 2. Get login link
      const response = await fetch("/api/snaptrade/login-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          riskrUserId: userId,
          customRedirect: window.location.href,
          connectionType: "read" // Read-only access
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate login link");
      }

      const { redirectURI } = await response.json();

      // 3. Open portal in new window
      const portal = window.open(
        redirectURI,
        "snaptrade-connect",
        "width=480,height=760,scrollbars=yes,resizable=yes"
      );

      if (!portal) {
        throw new Error("Failed to open portal. Please allow popups.");
      }

      // Monitor if window is closed without connecting
      const checkClosed = setInterval(() => {
        if (portal.closed) {
          clearInterval(checkClosed);
          // If still loading after window closed, user likely cancelled
          setTimeout(() => {
            if (loading) {
              setLoading(false);
              toast.info("Connection cancelled");
            }
          }, 1000);
        }
      }, 500);

    } catch (error: any) {
      toast.error("Failed to open connection portal", {
        description: error.message
      });
      setLoading(false);
      onError?.(error.message);
    }
  };

  return (
    <Button
      onClick={openPortal}
      disabled={loading}
      variant={variant}
      size={size}
      className={className}
    >
      <Shield className="h-4 w-4 mr-2" />
      {loading ? "Connecting..." : "Connect Broker"}
    </Button>
  );
}
