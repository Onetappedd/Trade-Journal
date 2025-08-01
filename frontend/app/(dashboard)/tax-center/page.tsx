"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Download, Calculator, FileText, Calendar, TrendingUp, TrendingDown, DollarSign } from "lucide-react"

const monthlyData = [
  { month: "Jan", gains: 2500, losses: -800 },
  { month: "Feb", gains: 1800, losses: -1200 },
  { month: "Mar", gains: 3200, losses: -600 },
  { month: "Apr", gains: 2100, losses: -1500 },
  { month: "May", gains: 2800, losses: -900 },
  { month: "Jun", gains: 3500, losses: -700 },
  { month: "Jul", gains: 2200, losses: -1100 },
  { month: "Aug", gains: 2900, losses: -800 },
  { month: "Sep", gains: 3100, losses: -1000 },
  { month: "Oct", gains: 2600, losses: -1300 },
  { month: "Nov", gains: 3300, losses: -500 },
  { month: "Dec", gains: 2700, losses: -900 },
]

const taxBreakdown = [
  { category: "Short-term Gains", amount: 15420, percentage: 45, color: "bg-red-500" },
  { category: "Long-term Gains", amount: 12380, percentage: 36, color: "bg-green-500" },
  { category: "Dividend Income", amount: 4200, percentage: 12, color: "bg-blue-500" },
  { category: "Interest Income", amount: 2400, percentage: 7, color: "bg-yellow-500" },
]

export default function TaxCenterPage() {
  const [taxableIncome, setTaxableIncome] = useState("")
  const [filingStatus, setFilingStatus] = useState("")
  const [estimatedTax, setEstimatedTax] = useState(0)

  const calculateTax = () => {
    const income = Number.parseFloat(taxableIncome) || 0
    let tax = 0

    if (filingStatus === "single") {
      if (income <= 11000) tax = income * 0.1
      else if (income <= 44725) tax = 1100 + (income - 11000) * 0.12
      else if (income <= 95375) tax = 5147 + (income - 44725) * 0.22
      else tax = 16290 + (income - 95375) * 0.24
    } else if (filingStatus === "married") {
      if (income <= 22000) tax = income * 0.1
      else if (income <= 89450) tax = 2200 + (income - 22000) * 0.12
      else if (income <= 190750) tax = 10294 + (income - 89450) * 0.22
      else tax = 32580 + (income - 190750) * 0.24
    }

    setEstimatedTax(Math.round(tax))
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Tax Center</h2>
        <div className="flex items-center space-x-2">
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Tax Documents
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Gains</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">$34,400</div>
                <p className="text-xs text-muted-foreground">+12% from last year</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Losses</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">$11,300</div>
                <p className="text-xs text-muted-foreground">-8% from last year</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Gains</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$23,100</div>
                <p className="text-xs text-muted-foreground">Taxable amount</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estimated Tax</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$5,544</div>
                <p className="text-xs text-muted-foreground">24% tax bracket</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Monthly Gains vs Losses</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="gains" fill="#22c55e" />
                    <Bar dataKey="losses" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Income Breakdown</CardTitle>
                <CardDescription>Distribution of taxable income sources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {taxBreakdown.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${item.color}`} />
                          <span className="text-sm font-medium">{item.category}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">${item.amount.toLocaleString()}</span>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                      <div className="text-xs text-muted-foreground text-right">{item.percentage}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  Form 1099-B
                </CardTitle>
                <CardDescription>Proceeds from broker transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Status:</span>
                    <Badge variant="secondary">Available</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Tax Year:</span>
                    <span className="text-sm">2024</span>
                  </div>
                  <Button className="w-full mt-4">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  Form 8949
                </CardTitle>
                <CardDescription>Sales and dispositions of capital assets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Status:</span>
                    <Badge variant="secondary">Available</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Tax Year:</span>
                    <span className="text-sm">2024</span>
                  </div>
                  <Button className="w-full mt-4">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  Schedule D
                </CardTitle>
                <CardDescription>Capital gains and losses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Status:</span>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Tax Year:</span>
                    <span className="text-sm">2024</span>
                  </div>
                  <Button className="w-full mt-4" disabled>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calculator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax Liability Calculator</CardTitle>
              <CardDescription>Estimate your tax liability based on trading gains</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="income">Total Taxable Income</Label>
                  <Input
                    id="income"
                    placeholder="Enter your total taxable income"
                    value={taxableIncome}
                    onChange={(e) => setTaxableIncome(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Filing Status</Label>
                  <Select value={filingStatus} onValueChange={setFilingStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select filing status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married Filing Jointly</SelectItem>
                      <SelectItem value="married-separate">Married Filing Separately</SelectItem>
                      <SelectItem value="head">Head of Household</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={calculateTax} className="w-full">
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Tax
              </Button>
              {estimatedTax > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">${estimatedTax.toLocaleString()}</div>
                      <p className="text-sm text-muted-foreground">Estimated Federal Tax</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planning" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  Important Tax Dates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Q4 Estimated Tax</div>
                      <div className="text-sm text-muted-foreground">January 15, 2025</div>
                    </div>
                    <Badge variant="destructive">Upcoming</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Tax Return Filing</div>
                      <div className="text-sm text-muted-foreground">April 15, 2025</div>
                    </div>
                    <Badge variant="outline">Future</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Extension Deadline</div>
                      <div className="text-sm text-muted-foreground">October 15, 2025</div>
                    </div>
                    <Badge variant="outline">Future</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tax Optimization Strategies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium">Tax-Loss Harvesting</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Offset gains with losses to reduce tax liability
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium">Hold for Long-Term</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Hold positions for over 1 year for better tax rates
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium">IRA Contributions</div>
                    <div className="text-sm text-muted-foreground mt-1">Maximize retirement account contributions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
