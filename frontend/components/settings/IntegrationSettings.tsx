"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, ExternalLink } from "lucide-react"

const brokers = [
  { id: "webull", name: "Webull", connected: true, autoSync: true },
  { id: "robinhood", name: "Robinhood", connected: false, autoSync: false },
  { id: "schwab", name: "Charles Schwab", connected: true, autoSync: false },
  { id: "ibkr", name: "Interactive Brokers", connected: false, autoSync: false },
  { id: "fidelity", name: "Fidelity", connected: false, autoSync: false },
  { id: "etrade", name: "E*TRADE", connected: false, autoSync: false },
]

const thirdPartyServices = [
  { id: "tradingview", name: "TradingView", connected: true, description: "Advanced charting and analysis" },
  { id: "finviz", name: "Finviz", connected: false, description: "Stock screener and market maps" },
  { id: "yahoo", name: "Yahoo Finance", connected: true, description: "Real-time market data" },
  { id: "alpha", name: "Alpha Vantage", connected: false, description: "Financial data API" },
]

export function IntegrationSettings() {
  const [brokerStates, setBrokerStates] = useState(brokers)
  const [serviceStates, setServiceStates] = useState(thirdPartyServices)

  const toggleBrokerConnection = (brokerId: string) => {
    setBrokerStates((prev) =>
      prev.map((broker) =>
        broker.id === brokerId ? { ...broker, connected: !broker.connected, autoSync: false } : broker,
      ),
    )
  }

  const toggleAutoSync = (brokerId: string) => {
    setBrokerStates((prev) =>
      prev.map((broker) => (broker.id === brokerId ? { ...broker, autoSync: !broker.autoSync } : broker)),
    )
  }

  const toggleServiceConnection = (serviceId: string) => {
    setServiceStates((prev) =>
      prev.map((service) => (service.id === serviceId ? { ...service, connected: !service.connected } : service)),
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Broker Connections</CardTitle>
          <CardDescription>Connect your brokerage accounts to automatically import trades</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {brokerStates.map((broker) => (
            <div key={broker.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-sm font-semibold">{broker.name.charAt(0)}</span>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{broker.name}</span>
                    {broker.connected ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="w-3 h-3 mr-1" />
                        Not Connected
                      </Badge>
                    )}
                  </div>
                  {broker.connected && (
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <Switch checked={broker.autoSync} onCheckedChange={() => toggleAutoSync(broker.id)} size="sm" />
                        <Label className="text-sm">Auto-sync trades</Label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant={broker.connected ? "outline" : "default"}
                onClick={() => toggleBrokerConnection(broker.id)}
              >
                {broker.connected ? "Disconnect" : "Connect"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Third-Party Services</CardTitle>
          <CardDescription>Connect external services for enhanced functionality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {serviceStates.map((service) => (
            <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-sm font-semibold">{service.name.charAt(0)}</span>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{service.name}</span>
                    {service.connected ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="w-3 h-3 mr-1" />
                        Not Connected
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button
                  variant={service.connected ? "outline" : "default"}
                  onClick={() => toggleServiceConnection(service.id)}
                >
                  {service.connected ? "Disconnect" : "Connect"}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
