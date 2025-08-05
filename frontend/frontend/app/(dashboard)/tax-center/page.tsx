"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, FileText, Calculator, TrendingUp, TrendingDown } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

// Mock data for tax calculations
const taxData = {
  totalGains: 45250.75,
  totalLosses: -12340.5,
  netGains: 32910.25,
  shortTermGains: 18500.0,
  longTermGains: 26750.75,
  shortTermLosses: -8200.25,
  longTermLosses: -4140.25,
  washSales: 2450.0,
  estimatedTax: 8227.56,
}

const monthlyData = [
  { month: "Jan", gains: 4200, losses: -1200 },
  { month: "Feb", gains: 3800, losses: -800 },
  { month: "Mar", gains: 5200, losses: -2100 },
  { month: "Apr", gains: 2900, losses: -900 },
  { month: "May", gains: 6100, losses: -1800 },
  { month: "Jun", gains: 4500, losses: -1200 },
  { month: "Jul", gains: 3700, losses: -1500 },
  { month: "Aug", gains: 5800, losses: -2200 },
  { month: "Sep", gains: 4100, losses: -700 },
  { month: "Oct", gains: 3200, losses: -340 },
  { month: "Nov", gains: 2850, losses: -600 },
  { month: "Dec", gains: 900, losses: 0 },
]

const washSaleTransactions = [
  { symbol: "AAPL", date: "2024-03-15", amount: -850.0, washSaleAmount: 425.0 },
  { symbol: "TSLA", date: "2024-06-22", amount: -1200.0, washSaleAmount: 600.0 },
  { symbol: "MSFT", date: "2024-09-10", amount: -950.0, washSaleAmount: 475.0 },
  { symbol: "GOOGL", date: "2024-11-05", amount: -1100.0, washSaleAmount: 550.0 },
  { symbol: "NVDA", date: "2024-12-01", amount: -800.0, washSaleAmount: 400.0 },
]

export default function TaxCenter() {
  const [selectedYear, setSelectedYear] = useState("2024")

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tax Center</h1>
          <p className="text-muted-foreground">
            Comprehensive tax reporting and calculations for your trading activities
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="gains-losses">Gains & Losses</TabsTrigger>
          <TabsTrigger value="wash-sales">Wash Sales</TabsTrigger>
          <TabsTrigger value="forms">Tax Forms</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Capital Gains</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${taxData.netGains.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+12.5% from last year</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Gains</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${taxData.totalGains.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Realized gains</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Losses</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">${Math.abs(taxData.totalLosses).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Realized losses</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estimated Tax</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${taxData.estimatedTax.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">25% tax rate applied</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly P&L Overview</CardTitle>
                <CardDescription>Gains and losses by month for {selectedYear}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
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
                    <span className="text-sm">${taxData.shortTermGains.toLocaleString()}</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Long-term Gains</span>
                    <span className="text-sm">${taxData.longTermGains.toLocaleString()}</span>
                  </div>
                  <Progress value={35} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Short-term Losses</span>
                    <span className="text-sm text-red-600">${Math.abs(taxData.shortTermLosses).toLocaleString()}</span>
                  </div>
                  <Progress value={25} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Long-term Losses</span>
                    <span className="text-sm text-red-600">${Math.abs(taxData.longTermLosses).toLocaleString()}</span>
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
              <CardTitle>Capital Gains & Losses Summary</CardTitle>
              <CardDescription>Detailed breakdown of your realized gains and losses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-green-600">Capital Gains</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Short-term (≤1 year)</span>
                      <span className="font-medium">${taxData.shortTermGains.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Long-term (&gt;1 year)</span>
                      <span className="font-medium">${taxData.longTermGains.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total Gains</span>
                        <span>${taxData.totalGains.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-red-600">Capital Losses</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Short-term (≤1 year)</span>
                      <span className="font-medium">${Math.abs(taxData.shortTermLosses).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Long-term (&gt;1 year)</span>
                      <span className="font-medium">${Math.abs(taxData.longTermLosses).toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total Losses</span>
                        <span>${Math.abs(taxData.totalLosses).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wash-sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Wash Sale Adjustments</CardTitle>
              <CardDescription>Transactions affected by wash sale rules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div>
                    <h4 className="font-semibold">Total Wash Sale Adjustments</h4>
                    <p className="text-sm text-muted-foreground">Amount of losses disallowed due to wash sale rules</p>
                  </div>
                  <Badge variant="secondary" className="text-lg">
                    ${taxData.washSales.toLocaleString()}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Affected Transactions</h4>
                  <div className="space-y-2">
                    {washSaleTransactions.map((transaction, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline">{transaction.symbol}</Badge>
                          <span className="text-sm">{transaction.date}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-red-600">
                            Loss: ${Math.abs(transaction.amount).toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Disallowed: ${transaction.washSaleAmount.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax Forms & Documents</CardTitle>
              <CardDescription>Generate and download tax forms for filing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Form 8949</h4>
                  <p className="text-sm text-muted-foreground mb-4">Sales and Other Dispositions of Capital Assets</p>
                  <Button variant="outline" className="w-full bg-transparent">
                    <Download className="mr-2 h-4 w-4" />
                    Download Form 8949
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Schedule D</h4>
                  <p className="text-sm text-muted-foreground mb-4">Capital Gains and Losses</p>
                  <Button variant="outline" className="w-full bg-transparent">
                    <Download className="mr-2 h-4 w-4" />
                    Download Schedule D
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">1099-B Summary</h4>
                  <p className="text-sm text-muted-foreground mb-4">Broker transaction summary</p>
                  <Button variant="outline" className="w-full bg-transparent">
                    <Download className="mr-2 h-4 w-4" />
                    Download 1099-B
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Tax Summary Report</h4>
                  <p className="text-sm text-muted-foreground mb-4">Comprehensive tax summary</p>
                  <Button variant="outline" className="w-full bg-transparent">
                    <Download className="mr-2 h-4 w-4" />
                    Download Summary
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
