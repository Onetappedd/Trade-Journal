"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Link2,
  RefreshCw,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Info,
  ShieldCheck,
  Loader2,
} from "lucide-react"
import { BrokerVerifiedBadge } from "@/components/snaptrade/BrokerVerifiedBadge"
import ConnectBrokerButton from "@/components/snaptrade/ConnectBrokerButton"
import { useAuth } from "@/providers/auth-provider"
import { toast } from "sonner"

interface Connection {
  id: string
  brokerName: string
  brokerSlug: string
  logoUrl?: string
  disabled: boolean
  cachedData?: {
    last_holdings_sync_at: string | null
  }
  accounts: Account[]
}

interface Account {
  account_id: string
  name: string
  number: string
  institution_name: string
  total_value: number | null
  currency: string | null
  last_successful_holdings_sync: string | null
}

export default function ConnectPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [connections, setConnections] = useState<Connection[]>([])
  const [brokerVerified, setBrokerVerified] = useState(false)
  const [lastVerifiedAt, setLastVerifiedAt] = useState<string | null>(null)
  const [reconnectDialog, setReconnectDialog] = useState<string | null>(null)
  const [removeDialog, setRemoveDialog] = useState<string | null>(null)
  const [infoDialog, setInfoDialog] = useState(false)
  const [expandedAccounts, setExpandedAccounts] = useState<string[]>([])

  useEffect(() => {
    if (user) {
      loadConnections()
    }
  }, [user])

  const loadConnections = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/snaptrade/connections")
      
      if (!response.ok) {
        throw new Error("Failed to load connections")
      }

      const result = await response.json()
      
      if (result.success) {
        setConnections(result.data.connections)
        setBrokerVerified(result.data.brokerVerified)
        setLastVerifiedAt(result.data.lastVerifiedAt)
      }
    } catch (error: any) {
      console.error("Load connections error:", error)
      toast.error("Failed to load connections", {
        description: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    if (!user) return

    try {
      setIsSyncing(true)
      const response = await fetch("/api/snaptrade/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riskrUserId: user.id })
      })

      if (!response.ok) {
        throw new Error("Sync failed")
      }

      const result = await response.json()
      toast.success("Data synced successfully", {
        description: `${result.connections} connections, ${result.accounts} accounts`
      })

      // Reload connections to get updated data
      await loadConnections()
    } catch (error: any) {
      toast.error("Sync failed", {
        description: error.message
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleRemoveConnection = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/snaptrade/connections/${connectionId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to remove connection")
      }

      toast.success("Connection removed")
      setRemoveDialog(null)
      await loadConnections()
    } catch (error: any) {
      toast.error("Failed to remove connection", {
        description: error.message
      })
    }
  }

  const toggleAccountExpand = (id: string) => {
    setExpandedAccounts((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    try {
      return new Date(dateString).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    } catch {
      return "Unknown"
    }
  }

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (amount === null) return "—"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount)
  }

  // Get all accounts from all connections
  const allAccounts = connections.flatMap(c => 
    c.accounts.map(account => ({ ...account, brokerName: c.brokerName }))
  )

  // Get broker names for badge
  const connectedBrokers = connections
    .filter(c => !c.disabled)
    .map(c => c.brokerName)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Connect your broker</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Securely link your brokerage via SnapTrade to auto-sync balances, holdings, orders, and activity.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {brokerVerified && (
              <BrokerVerifiedBadge
                verified={brokerVerified}
                brokers={connectedBrokers}
                lastSync={lastVerifiedAt || undefined}
              />
            )}
          </div>
        </div>

        {/* Connect Card */}
        <Card className="mb-8 border-2 border-dashed border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Link2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {connections.length > 0 ? "Connect another broker" : "Connect a broker"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Link your brokerage account securely
                    </p>
                  </div>
                </div>

                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Read-only access. You can disconnect anytime.
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    We never store your credentials. Authentication is handled by SnapTrade.
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                {user && (
                  <ConnectBrokerButton
                    userId={user.id}
                    onSuccess={loadConnections}
                    size="lg"
                    className="min-w-[200px]"
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connections Panel */}
        {connections.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Connections</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setInfoDialog(true)}>
                  <Info className="h-4 w-4 mr-2" />
                  What gets synced?
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Broker</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last holdings sync</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {connections.map((connection) => (
                      <TableRow key={connection.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                              {connection.logoUrl ? (
                                <img src={connection.logoUrl} alt={connection.brokerName} className="h-6 w-6" />
                              ) : (
                                <span className="text-2xl">🏦</span>
                              )}
                            </div>
                            <span className="font-medium">{connection.brokerName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={connection.disabled ? "secondary" : "default"}
                            className={
                              !connection.disabled
                                ? "bg-emerald-950/50 text-emerald-400 border-emerald-800/50"
                                : ""
                            }
                          >
                            {connection.disabled ? "Disabled" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(connection.cachedData?.last_holdings_sync_at || null)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setReconnectDialog(connection.id)}>
                                Reconnect
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={handleSync}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh data
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setRemoveDialog(connection.id)}
                              >
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Accounts Panel */}
        {allAccounts.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Institution</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead className="text-right">Total value</TableHead>
                      <TableHead>Last sync</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allAccounts.map((account) => (
                      <TableRow key={account.account_id}>
                        <TableCell className="font-medium">{account.brokerName}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {account.name} (…{account.number.slice(-4)})
                        </TableCell>
                        <TableCell>{account.currency || "USD"}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(account.total_value, account.currency)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(account.last_successful_holdings_sync)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={handleSync} disabled={isSyncing}>
                            {isSyncing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verification Explainer */}
        <Card className="mb-8 bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">About Broker Verification</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You're Broker-Verified when you have ≥1 active connection and holdings synced in the last 72 hours.
                  Your badge appears next to your name across RiskR.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Refresh */}
        {connections.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-semibold">Manual data refresh</h3>
                  <p className="text-sm text-muted-foreground">
                    Trigger a manual sync to update your holdings and balances immediately.
                  </p>
                </div>
                <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
                  {isSyncing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh data now
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reconnect Dialog */}
        <Dialog open={!!reconnectDialog} onOpenChange={() => setReconnectDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reconnect broker</DialogTitle>
              <DialogDescription>
                This will open a secure SnapTrade portal to re-authenticate your broker connection. Your existing data
                will be preserved.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReconnectDialog(null)}>
                Cancel
              </Button>
              {user && (
                <ConnectBrokerButton
                  userId={user.id}
                  onSuccess={() => {
                    setReconnectDialog(null)
                    loadConnections()
                  }}
                />
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Dialog */}
        <Dialog open={!!removeDialog} onOpenChange={() => setRemoveDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove connection</DialogTitle>
              <DialogDescription className="space-y-2">
                <p>Are you sure you want to remove this broker connection? This will:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Stop automatic syncing of holdings and balances</li>
                  <li>Remove your Broker-Verified badge</li>
                  <li>Preserve your existing trade history</li>
                </ul>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRemoveDialog(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => removeDialog && handleRemoveConnection(removeDialog)}
              >
                Remove connection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Info Dialog */}
        <Dialog open={infoDialog} onOpenChange={setInfoDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>What gets synced?</DialogTitle>
              <DialogDescription className="space-y-4 pt-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-foreground">Balances</h4>
                      <p className="text-sm">Cash balances and buying power across all accounts</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-foreground">Holdings</h4>
                      <p className="text-sm">Current positions, quantities, and market values</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-foreground">Orders</h4>
                      <p className="text-sm">Order history, fills, and pending orders</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-foreground">Activities</h4>
                      <p className="text-sm">Deposits, withdrawals, dividends, and other account activity</p>
                    </div>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
