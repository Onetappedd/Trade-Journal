/**
 * Broker Connections Example Component
 * Shows how to use ConnectBrokerButton and display connections
 * 
 * This is a reference implementation you can adapt for your needs
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ConnectBrokerButton from "./ConnectBrokerButton";
import { BrokerVerifiedBadge } from "./BrokerVerifiedBadge";
import RefreshConnectionButton from "./RefreshConnectionButton";
import SyncStatusIndicator from "./SyncStatusIndicator";
import { Trash2 } from "lucide-react";

interface Connection {
  id: string;
  brokerName: string;
  brokerSlug: string;
  disabled: boolean;
  createdDate: string;
  accounts: Account[];
}

interface Account {
  id: string;
  name: string;
  number: string;
  total_value: number;
  currency: string;
  last_successful_holdings_sync: string;
}

interface BrokerConnectionsProps {
  userId: string;
}

export default function BrokerConnectionsExample({ userId }: BrokerConnectionsProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [verification, setVerification] = useState({
    verified: false,
    lastSync: undefined as string | undefined,
    brokers: [] as string[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load connections
      const connectionsRes = await fetch("/api/snaptrade/connections", {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (connectionsRes.ok) {
        const data = await connectionsRes.json();
        setConnections(data.data.connections);
      }

      // Load verification status
      const verificationRes = await fetch(`/api/snaptrade/verification?userId=${userId}`);
      if (verificationRes.ok) {
        const data = await verificationRes.json();
        setVerification(data);
      }

    } catch (error) {
      console.error("Failed to load broker data:", error);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Verification Badge */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            Broker Connections
            <BrokerVerifiedBadge
              verified={verification.verified}
              lastSync={verification.lastSync}
              brokers={verification.brokers}
              size="lg"
            />
          </h2>
          <p className="text-muted-foreground">
            Connect your brokerage accounts for read-only access
          </p>
        </div>

        <ConnectBrokerButton
          userId={userId}
          onSuccess={loadData}
        />
      </div>

      {/* Connections List */}
      {connections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No broker connections yet
            </p>
            <ConnectBrokerButton
              userId={userId}
              onSuccess={loadData}
              variant="outline"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {connections.map((connection) => (
            <Card key={connection.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="flex items-center gap-2">
                      {connection.brokerName}
                      {connection.disabled && (
                        <Badge variant="destructive">Disconnected</Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>
                        Connected {new Date(connection.createdDate).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <SyncStatusIndicator
                        lastSync={connection.accounts[0]?.last_successful_holdings_sync}
                        size="sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <RefreshConnectionButton
                      userId={userId}
                      authorizationId={connection.id}
                      brokerName={connection.brokerName}
                      lastSync={connection.accounts[0]?.last_successful_holdings_sync}
                      onSuccess={loadData}
                      size="sm"
                      variant="ghost"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {connection.accounts.length > 0 && (
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Accounts</h4>
                    {connection.accounts.map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium text-sm">{account.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {account.number}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: account.currency || 'USD'
                            }).format(account.total_value || 0)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Last sync: {account.last_successful_holdings_sync
                              ? new Date(account.last_successful_holdings_sync).toLocaleDateString()
                              : 'Never'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
