"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { Download, FileText, Calculator, TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react"

// Mock data for tax calculations
const taxData = [
  { name: "Short-term Gains", value: 15000, color: "#ef4444" },
  { name: "Long-term Gains", value: 25000, color: "#22c55e" },
  { name: "Short-term Losses", value: 8000, color: "#f97316" },
  { name: "Long-term Losses", value: 3000, color: "#eab308" },
]

const monthlyData = [
  { month: "Jan", gains: 2400, losses: 1200 },
  { month: "Feb", gains: 1398, losses: 800 },
  { month: "Mar", gains: 9800, losses: 2000 },
  { month: "Apr", gains: 3908, losses: 1500 },
  { month: "May", gains: 4800, losses: 900 },
  { month: "Jun", gains: 3800, losses: 1100 },
  { month: "Jul", gains: 4300, losses: 1300 },
  { month: "Aug", gains: 5200, losses: 1600 },
  { month: "Sep", gains: 3200, losses: 800 },
  { month: "Oct", gains: 4100, losses: 1000 },
  { month: "Nov", gains: 3600, losses: 1200 },
  { month: "Dec", gains: 4200, losses: 900 },
]

const taxDocuments = [
  { name: "Form 8949 - Sales and Other Dispositions", status: "Ready", date: "2024-01-15" },
  { name: "Schedule D - Capital Gains and Losses", status: "Ready", date: "2024-01-15" },
  { name: "Form 1040 - Individual Income Tax Return", status: "Pending", date: "2024-01-20" },
  { name: "Wash Sale Report", status: "Ready", date: "2024-01-10" },
]

export default function TaxCenter() {
  const [selectedYear, setSelectedYear] = useState("2024")
  const [selectedBroker, setSelectedBroker] = useState("all")

  const totalGains = taxData.filter((item) => item.name.includes("Gains")).reduce((sum, item) => sum + item.value, 0)
  const totalLosses = taxData.filter((item) => item.name.includes("Losses")).reduce((sum, item) => sum + item.value, 0)
  const netGainLoss = totalGains - totalLosses

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tax Center</h1>
          <p className="text-muted-foreground">Manage your trading tax documents and calculations</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedBroker} onValueChange={setSelectedBroker}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Brokers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brokers</SelectItem>
              <SelectItem value="webull">Webull</SelectItem>
              <SelectItem value="robinhood">Robinhood</SelectItem>
              <SelectItem value="td_ameritrade">TD Ameritrade</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gains</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalGains.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12% from last year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Losses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalLosses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">-8% from last year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Gain/Loss</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netGainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${netGainLoss.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {netGainLoss >= 0 ? "Taxable gain" : "Tax loss carryforward"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Tax</CardTitle>
            <Calculator className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ${Math.max(0, netGainLoss * 0.22).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">22% tax bracket estimate</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="calculator">Tax Calculator</TabsTrigger>
          <TabsTrigger value="planning">Tax Planning</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Capital Gains/Losses Breakdown</CardTitle>
                <CardDescription>Distribution of your trading results for {selectedYear}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={taxData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {taxData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Amount"]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Gains vs Losses</CardTitle>
                <CardDescription>Monthly breakdown of your trading performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, ""]} />
                    <Legend />
                    <Bar dataKey="gains" fill="#22c55e" name="Gains" />
                    <Bar dataKey="losses" fill="#ef4444" name="Losses" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tax Summary</CardTitle>
              <CardDescription>Key tax information for the {selectedYear} tax year</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Short-term Capital Gains</Label>
                  <div className="text-2xl font-bold text-red-600">$15,000</div>
                  <p className="text-xs text-muted-foreground">Taxed as ordinary income</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Long-term Capital Gains</Label>
                  <div className="text-2xl font-bold text-green-600">$25,000</div>
                  <p className="text-xs text-muted-foreground">Preferential tax rates apply</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Net Capital Loss</Label>
                  <div className="text-2xl font-bold text-orange-600">$11,000</div>
                  <p className="text-xs text-muted-foreground">Can offset gains</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax Documents</CardTitle>
              <CardDescription>Download your tax forms and supporting documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {taxDocuments.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <h4 className="font-medium">{doc.name}</h4>
                        <p className="text-sm text-muted-foreground">Generated on {doc.date}</p>
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
              <Separator className="my-4" />
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  All documents are generated based on your trading activity
                </p>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax Calculator</CardTitle>
              <CardDescription>Estimate your tax liability based on your trading gains</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="income">Annual Income</Label>
                  <Input id="income" type="number" placeholder="75000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filing-status">Filing Status</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select filing status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married-joint">Married Filing Jointly</SelectItem>
                      <SelectItem value="married-separate">Married Filing Separately</SelectItem>
                      <SelectItem value="head">Head of Household</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="short-term-gains">Short-term Gains</Label>
                  <Input id="short-term-gains" type="number" placeholder="15000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="long-term-gains">Long-term Gains</Label>
                  <Input id="long-term-gains" type="number" placeholder="25000" />
                </div>
              </div>
              <Button className="w-full">Calculate Tax Liability</Button>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Estimated Tax Liability</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Short-term capital gains tax:</span>
                    <span className="font-medium">$3,300</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Long-term capital gains tax:</span>
                    <span className="font-medium">$3,750</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total estimated tax:</span>
                    <span>$7,050</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax Planning Strategies</CardTitle>
              <CardDescription>Optimize your tax situation with these strategies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Tax-Loss Harvesting</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Realize losses to offset gains and reduce your tax liability.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Potential savings: $2,420</span>
                    <Button size="sm" variant="outline">
                      Learn More
                    </Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Hold Period Optimization</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Hold positions for over a year to qualify for long-term capital gains rates.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Potential savings: $3,750</span>
                    <Button size="sm" variant="outline">
                      Learn More
                    </Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Retirement Account Contributions</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Maximize contributions to tax-advantaged retirement accounts.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Potential savings: $1,320</span>
                    <Button size="sm" variant="outline">
                      Learn More
                    </Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Wash Sale Rule Avoidance</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Avoid repurchasing substantially identical securities within 30 days.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Current wash sales: 3</span>
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Upcoming Tax Dates</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-muted rounded">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Q4 Estimated Tax Payment</span>
                    </div>
                    <Badge variant="outline">Jan 15, 2024</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Tax Return Filing Deadline</span>
                    </div>
                    <Badge variant="outline">Apr 15, 2024</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
