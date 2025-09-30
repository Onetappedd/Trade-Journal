"use client"

import { useState } from "react"
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
import { BrokerVerifiedBadge } from "@/components/broker-verified-badge"
import { WebhookStatusChip } from "@/components/webhook-status-chip"

// Mock data
const mockConnections = [
  {
    id: "1",
    broker: "Robinhood",
    logo: "🏦",
    status: "active",
    lastSync: "Sep 28, 3:42 PM",
  },
  {
    id: "2",
    broker: "Fidelity",
    logo: "🏛️",
    status: "disabled",
    lastSync: "Sep 14, 10:11 AM",
  },
]

const mockAccounts = [
  {
    id: "1",
    institution: "Fidelity",
    accountNumber: "Individual (…8921)",
    currency: "USD",
    totalValue: "$24,580.42",
    lastSync: "Sep 28, 3:42 PM",
    synced: {
      balances: true,
      holdings: true,
      orders: true,
      activities: true,
    },
  },
  {
    id: "2",
    institution: "Robinhood",
    accountNumber: "Margin (…1140)",
    currency: "USD",
    totalValue: "$5,219.10",
    lastSync: "Sep 28, 3:40 PM",
    synced: {
      balances: true,
      holdings: true,
      orders: true,
      activities: false,
    },
  },
]

export default function ConnectPage() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showConnectSuccess, setShowConnectSuccess] = useState(false)
  const [reconnectDialog, setReconnectDialog] = useState<string | null>(null)
  const [removeDialog, setRemoveDialog] = useState<string | null>(null)
  const [infoDialog, setInfoDialog] = useState(false)
  const [expandedAccounts, setExpandedAccounts] = useState<string[]>([])

  const handleConnect = () => {
    setIsConnecting(true)
    // Simulate SnapTrade portal opening
    setTimeout(() => {
      setIsConnecting(false)
      setShowConnectSuccess(true)
    }, 2000)
  }

  const handleFinishSync = () => {
    setIsSyncing(true)
    setTimeout(() => {
      setIsSyncing(false)
    }, 3000)
  }

  const toggleAccountExpand = (id: string) => {
    setExpandedAccounts((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
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
            <BrokerVerifiedBadge variant="default" brokers={["Robinhood", "Fidelity"]} lastSync="Sep 28, 3:42 PM" />
            <WebhookStatusChip status="healthy" lastUpdate="12:14 PM" />
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
                      {showConnectSuccess ? "Connection successful!" : "Connect a broker"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {showConnectSuccess ? "Now finish syncing your data" : "Link your brokerage account securely"}
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
                {!showConnectSuccess ? (
                  <Button size="lg" onClick={handleConnect} disabled={isConnecting} className="min-w-[200px]">
                    {isConnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Link2 className="mr-2 h-4 w-4" />
                        Connect a broker
                      </>
                    )}
                  </Button>
                ) : (
                  <Button size="lg" onClick={handleFinishSync} disabled={isSyncing} className="min-w-[200px]">
                    {isSyncing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Finish & sync
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connections Panel */}
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
                  {mockConnections.map((connection) => (
                    <TableRow key={connection.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-2xl">
                            {connection.logo}
                          </div>
                          <span className="font-medium">{connection.broker}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={connection.status === "active" ? "default" : "secondary"}
                          className={
                            connection.status === "active"
                              ? "bg-emerald-950/50 text-emerald-400 border-emerald-800/50"
                              : ""
                          }
                        >
                          {connection.status === "active" ? "Active" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{connection.lastSync}</TableCell>
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
                            <DropdownMenuItem>{connection.status === "active" ? "Disable" : "Enable"}</DropdownMenuItem>
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

        {/* Accounts Panel */}
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
                  {mockAccounts.map((account) => (
                    <Collapsible
                      key={account.id}
                      open={expandedAccounts.includes(account.id)}
                      onOpenChange={() => toggleAccountExpand(account.id)}
                      asChild
                    >
                      <>
                        <TableRow className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-medium">{account.institution}</TableCell>
                          <TableCell className="text-muted-foreground">{account.accountNumber}</TableCell>
                          <TableCell>{account.currency}</TableCell>
                          <TableCell className="text-right font-semibold">{account.totalValue}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{account.lastSync}</TableCell>
                          <TableCell>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform ${
                                    expandedAccounts.includes(account.id) ? "rotate-180" : ""
                                  }`}
                                />
                              </Button>
                            </CollapsibleTrigger>
                          </TableCell>
                        </TableRow>
                        <CollapsibleContent asChild>
                          <TableRow>
                            <TableCell colSpan={6} className="bg-muted/30">
                              <div className="p-4 space-y-3">
                                <h4 className="text-sm font-semibold">What's synced</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {Object.entries(account.synced).map(([key, value]) => (
                                    <div key={key} className="flex items-center gap-2">
                                      {value ? (
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                      ) : (
                                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                      )}
                                      <span
                                        className={`text-sm capitalize ${
                                          value ? "text-foreground" : "text-muted-foreground"
                                        }`}
                                      >
                                        {key}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        </CollapsibleContent>
                      </>
                    </Collapsible>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

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
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-semibold">Manual data refresh</h3>
                <p className="text-sm text-muted-foreground">
                  Trigger a manual sync to update your holdings and balances immediately.
                </p>
              </div>
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh data now
              </Button>
            </div>
          </CardContent>
        </Card>

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
              <Button onClick={() => setReconnectDialog(null)}>Open portal</Button>
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
              <Button variant="destructive" onClick={() => setRemoveDialog(null)}>
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
