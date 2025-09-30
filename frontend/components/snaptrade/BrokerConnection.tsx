'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react';

interface Broker {
  id: string;
  name: string;
  slug: string;
  logo: string;
  supported: boolean;
}

interface Connection {
  id: string;
  brokerId: string;
  status: 'active' | 'inactive' | 'error';
  lastSync: string;
  accounts: Account[];
}

interface Account {
  id: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  lastSync: string;
}

interface BrokerConnectionProps {
  userId: string;
}

export default function BrokerConnection({ userId }: BrokerConnectionProps) {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brokerVerified, setBrokerVerified] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load brokers and connections in parallel
      const [brokersRes, connectionsRes] = await Promise.all([
        fetch('/api/snaptrade/brokers'),
        fetch('/api/snaptrade/connections')
      ]);

      if (!brokersRes.ok || !connectionsRes.ok) {
        throw new Error('Failed to load data');
      }

      const brokersData = await brokersRes.json();
      const connectionsData = await connectionsRes.json();

      setBrokers(brokersData.data.brokers);
      setConnections(connectionsData.data.connections);
      setBrokerVerified(connectionsData.data.brokerVerified);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (brokerId: string) => {
    try {
      setConnecting(true);
      setError(null);

      // Register user if not already registered
      const registerRes = await fetch('/api/snaptrade/register', {
        method: 'POST'
      });

      if (!registerRes.ok) {
        throw new Error('Failed to register with SnapTrade');
      }

      // Generate connection portal
      const portalRes = await fetch('/api/snaptrade/portal', {
        method: 'POST'
      });

      if (!portalRes.ok) {
        throw new Error('Failed to generate connection portal');
      }

      const portalData = await portalRes.json();
      
      // Open connection portal in new window
      const portalWindow = window.open(
        portalData.data.portalUrl,
        'snaptrade-connection',
        'width=800,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for connection completion
      const checkConnection = setInterval(async () => {
        if (portalWindow?.closed) {
          clearInterval(checkConnection);
          setConnecting(false);
          // Reload connections
          await loadData();
        }
      }, 1000);

    } catch (err: any) {
      setError(err.message);
      setConnecting(false);
    }
  };

  const handleSync = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/snaptrade/connections/${connectionId}/sync`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to sync connection');
      }

      // Reload data
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Broker Verified Badge */}
      {brokerVerified && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Broker-Verified</strong> - You have active broker connections with recent data sync.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Connections Section */}
      <Card>
        <CardHeader>
          <CardTitle>Your Broker Connections</CardTitle>
          <CardDescription>
            Manage your connected broker accounts and sync status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No broker connections yet. Connect a broker below to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {connections.map((connection) => (
                <div key={connection.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(connection.status)}
                      <div>
                        <h3 className="font-medium">
                          {brokers.find(b => b.id === connection.brokerId)?.name || connection.brokerId}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Last sync: {new Date(connection.lastSync).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(connection.status)}>
                        {connection.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSync(connection.id)}
                        disabled={connecting}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Accounts */}
                  {connection.accounts.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Accounts:</h4>
                      {connection.accounts.map((account) => (
                        <div key={account.id} className="text-sm text-gray-600">
                          {account.accountNumber} ({account.accountType}) - ${account.balance.toLocaleString()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Brokers */}
      <Card>
        <CardHeader>
          <CardTitle>Connect a Broker</CardTitle>
          <CardDescription>
            Choose a broker to connect your account for automated data sync
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brokers.map((broker) => (
              <div key={broker.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3 mb-3">
                  {broker.logo && (
                    <img 
                      src={broker.logo} 
                      alt={broker.name}
                      className="h-8 w-8 object-contain"
                    />
                  )}
                  <div>
                    <h3 className="font-medium">{broker.name}</h3>
                    <p className="text-sm text-gray-500">{broker.slug}</p>
                  </div>
                </div>
                
                <Button
                  onClick={() => handleConnect(broker.id)}
                  disabled={connecting}
                  className="w-full"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Connect
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
