/**
 * Connect Broker Modal Component (Alternative - uses iframe)
 * Embeds SnapTrade connection portal in a modal using snaptrade-react
 * Keeps user in-app without opening new window
 * 
 * Usage:
 * <ConnectBrokerModal 
 *   userId={user.id} 
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSuccess={() => refetchConnections()}
 * />
 */

"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield, Loader2 } from "lucide-react";

interface ConnectBrokerModalProps {
  userId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  trigger?: React.ReactNode;
}

export default function ConnectBrokerModal({
  userId,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
  onError,
  trigger
}: ConnectBrokerModalProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [redirectURI, setRedirectURI] = useState<string | null>(null);

  // Use controlled or uncontrolled state
  const isOpen = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setIsOpen = controlledOnOpenChange || setUncontrolledOpen;

  useEffect(() => {
    if (isOpen && !redirectURI) {
      generateLoginLink();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    // Listen for messages from iframe
    const handler = (e: MessageEvent) => {
      const data = e.data;

      if (data?.status === "SUCCESS") {
        toast.success("Broker connected successfully!");
        
        // Sync data after successful connection
        syncConnectionData().then(() => {
          onSuccess?.();
          setIsOpen(false);
        });
      }

      if (data?.status === "ERROR") {
        const errorMessage = data.error || "Failed to connect broker";
        toast.error("Connection failed", {
          description: errorMessage
        });
        onError?.(errorMessage);
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSuccess, onError]);

  const generateLoginLink = async () => {
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
          connectionType: "read" // Read-only access
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate login link");
      }

      const { redirectURI } = await response.json();
      setRedirectURI(redirectURI);
      setLoading(false);

    } catch (error: any) {
      toast.error("Failed to load connection portal", {
        description: error.message
      });
      setLoading(false);
      onError?.(error.message);
      setIsOpen(false);
    }
  };

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

    } catch (error: any) {
      toast.error("Sync failed", {
        description: error.message
      });
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setRedirectURI(null);
  };

  return (
    <>
      {trigger && (
        <div onClick={() => setIsOpen(true)}>
          {trigger}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              Connect Your Broker
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 relative">
            {loading || !redirectURI ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Loading connection portal...
                  </p>
                </div>
              </div>
            ) : (
              <iframe
                src={redirectURI}
                className="w-full h-full rounded-md border"
                title="SnapTrade Connection Portal"
                allow="clipboard-read; clipboard-write"
              />
            )}
          </div>

          <div className="text-xs text-muted-foreground text-center">
            <p>
              Secured by SnapTrade • Read-only access • 
              <a href="#" className="underline ml-1">Privacy Policy</a>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Trigger Button Component
 * Use as trigger for the modal
 */
export function ConnectBrokerTrigger() {
  return (
    <Button>
      <Shield className="h-4 w-4 mr-2" />
      Connect Broker
    </Button>
  );
}
