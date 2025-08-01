"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Download, FileText, Calculator, TrendingUp, TrendingDown } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

// Mock data for tax calculations
const taxData = {
  summary: {
    totalGains: 45250.75,
    totalLosses: -12340.5,
    netGains: 32910.25,
    shortTermGains: 18500.0,
    longTermGains: 26750.75,
    shortTermLosses: -8200.25,
    longTermLosses: -4140.25,
    estimatedTax: 7898.46,
  },
  monthlyData: [
    { month: "Jan", gains: 4200, losses: -1200, net: 3000 },
    { month: "Feb", gains: 3800, losses: -800, net: 3000 },
    { month: "Mar", gains: 5200, losses: -1800, net: 3400 },
    { month: "Apr", gains: 2900, losses: -2100, net: 800 },
    { month: "May", gains: 6100, losses: -900, net: 5200 },
    { month: "Jun", gains: 4800, losses: -1500, net: 3300 },
    { month: "Jul", gains: 3700, losses: -1200, net: 2500 },
    { month: "Aug", gains: 5500, losses: -800, net: 4700 },
    { month: "Sep", gains: 4200, losses: -1600, net: 2600 },
    { month: "Oct", gains: 3900, losses: -900, net: 3000 },
    { month: "Nov", gains: 2800, losses: -400, net: 2400 },
    { month: "Dec", gains: 2350, losses: -40, net: 2310 },
  ],
  documents: [
    { name: "1099-B Form", status: "Ready", date: "2024-01-15", type: "Tax Form" },
    { name: "Schedule D", status: "Pending", date: "2024-01-20", type: "Tax Form" },
    { name: "Trade Summary Report", status: "Ready", date: "2024-01-10", type: "Report" },
    { name: "Wash Sale Report", status: "Ready", date: "2024-01-12", type: "Report" },
  ],
}

export default function TaxCenterPage() {
  const [selectedYear, setSelectedYear] = useState("2024")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Tax Center</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="gains-losses">Gains & Losses</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="wash-sales">Wash Sales</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Gains</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(taxData.summary.netGains)}</div>
                <p className="text-xs text-muted-foreground">+12.5% from last year</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Gains</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(taxData.summary.totalGains)}</div>
                <p className="text-xs text-muted-foreground">Realized gains</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Losses</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(taxData.summary.totalLosses)}</div>
                <p className="text-xs text-muted-foreground">Realized losses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estimated Tax</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(taxData.summary.estimatedTax)}</div>
                <p className="text-xs text-muted-foreground">24% tax bracket</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Performance</CardTitle>
                <CardDescription>Gains and losses by month for {selectedYear}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={taxData.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="gains" fill="#22c55e" name="Gains" />
                    <Bar dataKey="losses" fill="#ef4444" name="Losses" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tax Breakdown</CardTitle>
                <CardDescription>Short-term vs Long-term capital gains</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Short-term Gains</span>
                    <span className="text-sm">{formatCurrency(taxData.summary.shortTermGains)}</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Long-term Gains</span>
                    <span className="text-sm">{formatCurrency(taxData.summary.longTermGains)}</span>
                  </div>
                  <Progress value={35} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Short-term Losses</span>
                    <span className="text-sm text-red-600">{formatCurrency(taxData.summary.shortTermLosses)}</span>
                  </div>
                  <Progress value={25} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Long-term Losses</span>
                    <span className="text-sm text-red-600">{formatCurrency(taxData.summary.longTermLosses)}</span>
                  </div>
                  <Progress value={15} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gains-losses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Gains & Losses</CardTitle>
              <CardDescription>Complete breakdown of your realized gains and losses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-green-600">Capital Gains</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Short-term (&lt; 1 year)</span>
                        <span>{formatCurrency(taxData.summary.shortTermGains)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Long-term (&gt; 1 year)</span>
                        <span>{formatCurrency(taxData.summary.longTermGains)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-1">
                        <span>Total Gains</span>
                        <span>{formatCurrency(taxData.summary.totalGains)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-red-600">Capital Losses</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Short-term (&lt; 1 year)</span>
                        <span>{formatCurrency(taxData.summary.shortTermLosses)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Long-term (&gt; 1 year)</span>
                        <span>{formatCurrency(taxData.summary.longTermLosses)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-1">
                        <span>Total Losses</span>
                        <span>{formatCurrency(taxData.summary.totalLosses)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Net Capital Gains</span>
                    <span className="text-green-600">{formatCurrency(taxData.summary.netGains)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>Estimated Tax Liability (24% bracket)</span>
                    <span>{formatCurrency(taxData.summary.estimatedTax)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax Documents</CardTitle>
              <CardDescription>Download your tax forms and reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {taxData.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <h4 className="font-semibold">{doc.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {doc.type} • Generated {doc.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={doc.status === "Ready" ? "default" : "secondary"}>{doc.status}</Badge>
                      {doc.status === "Ready" && (
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wash-sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Wash Sale Analysis</CardTitle>
              <CardDescription>Review potential wash sale violations and adjustments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Wash Sales Detected</h3>
                <p className="text-muted-foreground">
                  Great! No wash sale violations were found in your trading activity.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
