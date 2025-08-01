"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Download, FileText, Calculator, DollarSign, Calendar, AlertTriangle, CheckCircle, Clock } from "lucide-react"
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

interface TaxLot {
  id: string
  symbol: string
  purchaseDate: Date
  saleDate: Date
  quantity: number
  purchasePrice: number
  salePrice: number
  gainLoss: number
  term: "short" | "long"
  washSale: boolean
}

interface TaxSummary {
  totalGainLoss: number
  shortTermGainLoss: number
  longTermGainLoss: number
  washSaleAdjustments: number
  taxableEvents: number
}

const mockTaxLots: TaxLot[] = [
  {
    id: "1",
    symbol: "AAPL",
    purchaseDate: new Date(2023, 0, 15),
    saleDate: new Date(2023, 5, 20),
    quantity: 100,
    purchasePrice: 150.25,
    salePrice: 175.5,
    gainLoss: 2525.0,
    term: "long",
    washSale: false,
  },
  {
    id: "2",
    symbol: "TSLA",
    purchaseDate: new Date(2023, 8, 10),
    saleDate: new Date(2023, 10, 15),
    quantity: 50,
    purchasePrice: 248.75,
    salePrice: 235.2,
    gainLoss: -677.5,
    term: "short",
    washSale: false,
  },
  {
    id: "3",
    symbol: "NVDA",
    purchaseDate: new Date(2023, 2, 5),
    saleDate: new Date(2023, 11, 1),
    quantity: 25,
    purchasePrice: 520.0,
    salePrice: 485.3,
    gainLoss: -867.5,
    term: "long",
    washSale: true,
  },
  {
    id: "4",
    symbol: "MSFT",
    purchaseDate: new Date(2023, 6, 12),
    saleDate: new Date(2023, 9, 25),
    quantity: 75,
    purchasePrice: 378.5,
    salePrice: 395.75,
    gainLoss: 1293.75,
    term: "short",
    washSale: false,
  },
]

const taxSummaryData = [
  { name: "Short-term Gains", value: 1293.75, color: "#10b981" },
  { name: "Short-term Losses", value: 677.5, color: "#ef4444" },
  { name: "Long-term Gains", value: 2525.0, color: "#3b82f6" },
  { name: "Long-term Losses", value: 867.5, color: "#f59e0b" },
]

const monthlyData = [
  { month: "Jan", shortTerm: 0, longTerm: 0 },
  { month: "Feb", shortTerm: 0, longTerm: 0 },
  { month: "Mar", shortTerm: 0, longTerm: 0 },
  { month: "Apr", shortTerm: 0, longTerm: 0 },
  { month: "May", shortTerm: 0, longTerm: 0 },
  { month: "Jun", shortTerm: 0, longTerm: 2525 },
  { month: "Jul", shortTerm: 0, longTerm: 0 },
  { month: "Aug", shortTerm: 0, longTerm: 0 },
  { month: "Sep", shortTerm: 1293.75, longTerm: 0 },
  { month: "Oct", shortTerm: 0, longTerm: 0 },
  { month: "Nov", shortTerm: -677.5, longTerm: 0 },
  { month: "Dec", shortTerm: 0, longTerm: -867.5 },
]

export default function TaxCenterPage() {
  const [selectedYear, setSelectedYear] = useState("2023")
  const [selectedBroker, setSelectedBroker] = useState("all")

  const calculateTaxSummary = (): TaxSummary => {
    const shortTermGains = mockTaxLots.filter((lot) => lot.term === "short" && lot.gainLoss > 0)
    const shortTermLosses = mockTaxLots.filter((lot) => lot.term === "short" && lot.gainLoss < 0)
    const longTermGains = mockTaxLots.filter((lot) => lot.term === "long" && lot.gainLoss > 0)
    const longTermLosses = mockTaxLots.filter((lot) => lot.term === "long" && lot.gainLoss < 0)

    const shortTermGainLoss =
      shortTermGains.reduce((sum, lot) => sum + lot.gainLoss, 0) +
      shortTermLosses.reduce((sum, lot) => sum + lot.gainLoss, 0)
    const longTermGainLoss =
      longTermGains.reduce((sum, lot) => sum + lot.gainLoss, 0) +
      longTermLosses.reduce((sum, lot) => sum + lot.gainLoss, 0)

    return {
      totalGainLoss: shortTermGainLoss + longTermGainLoss,
      shortTermGainLoss,
      longTermGainLoss,
      washSaleAdjustments: mockTaxLots
        .filter((lot) => lot.washSale)
        .reduce((sum, lot) => sum + Math.abs(lot.gainLoss), 0),
      taxableEvents: mockTaxLots.length,
    }
  }

  const taxSummary = calculateTaxSummary()

  return (
    <div className="flex flex-col">
      <Navbar title="Tax Center" />

      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Tax Center</h2>
            <p className="text-muted-foreground">
              Manage your tax reporting and download necessary documents for filing.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
                <SelectItem value="2021">2021</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </div>
        </div>

        {/* Tax Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div
                    className={`text-2xl font-bold ${taxSummary.totalGainLoss >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    ${taxSummary.totalGainLoss.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">Total Gain/Loss</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div
                    className={`text-2xl font-bold ${taxSummary.shortTermGainLoss >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    ${taxSummary.shortTermGainLoss.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">Short-term</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div
                    className={`text-2xl font-bold ${taxSummary.longTermGainLoss >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    ${taxSummary.longTermGainLoss.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">Long-term</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{taxSummary.taxableEvents}</div>
                  <p className="text-xs text-muted-foreground">Taxable Events</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="calculator">Tax Calculator</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Gain/Loss Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Gain/Loss Breakdown</CardTitle>
                  <CardDescription>Distribution of your capital gains and losses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={taxSummaryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {taxSummaryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, ""]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Tax Impact</CardTitle>
                  <CardDescription>Realized gains and losses by month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, ""]} />
                        <Legend />
                        <Bar dataKey="shortTerm" fill="#ef4444" name="Short-term" />
                        <Bar dataKey="longTerm" fill="#3b82f6" name="Long-term" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tax Optimization Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Tax Optimization Recommendations</CardTitle>
                <CardDescription>Strategies to minimize your tax liability</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Tax-Loss Harvesting</h4>
                      <p className="text-sm text-muted-foreground">
                        You have ${Math.abs(taxSummary.shortTermGainLoss + taxSummary.longTermGainLoss).toFixed(2)} in
                        unrealized losses that could offset gains.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Wash Sale Warning</h4>
                      <p className="text-sm text-muted-foreground">
                        ${taxSummary.washSaleAdjustments.toFixed(2)} in wash sale adjustments detected. Review your
                        transactions.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Hold Period Optimization</h4>
                      <p className="text-sm text-muted-foreground">
                        Consider holding positions for over 1 year to qualify for long-term capital gains rates.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Taxable Transactions</CardTitle>
                <CardDescription>All realized gains and losses for tax year {selectedYear}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Select value={selectedBroker} onValueChange={setSelectedBroker}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by broker" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Brokers</SelectItem>
                        <SelectItem value="webull">Webull</SelectItem>
                        <SelectItem value="robinhood">Robinhood</SelectItem>
                        <SelectItem value="td_ameritrade">TD Ameritrade</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Purchase Date</TableHead>
                          <TableHead>Sale Date</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Purchase Price</TableHead>
                          <TableHead>Sale Price</TableHead>
                          <TableHead>Gain/Loss</TableHead>
                          <TableHead>Term</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockTaxLots.map((lot) => (
                          <TableRow key={lot.id}>
                            <TableCell className="font-medium">{lot.symbol}</TableCell>
                            <TableCell>{lot.purchaseDate.toLocaleDateString()}</TableCell>
                            <TableCell>{lot.saleDate.toLocaleDateString()}</TableCell>
                            <TableCell>{lot.quantity}</TableCell>
                            <TableCell>${lot.purchasePrice.toFixed(2)}</TableCell>
                            <TableCell>${lot.salePrice.toFixed(2)}</TableCell>
                            <TableCell>
                              <span className={lot.gainLoss >= 0 ? "text-green-600" : "text-red-600"}>
                                {lot.gainLoss >= 0 ? "+" : ""}${lot.gainLoss.toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={lot.term === "long" ? "default" : "secondary"}>
                                {lot.term === "long" ? "Long-term" : "Short-term"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {lot.washSale ? (
                                <Badge variant="destructive">Wash Sale</Badge>
                              ) : (
                                <Badge variant="outline">Normal</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
                  {[
                    {
                      name: "Form 1099-B",
                      description: "Proceeds from broker and barter exchange transactions",
                      status: "Available",
                      date: "2024-01-31",
                    },
                    {
                      name: "Form 8949",
                      description: "Sales and other dispositions of capital assets",
                      status: "Generated",
                      date: "2024-01-15",
                    },
                    {
                      name: "Schedule D",
                      description: "Capital gains and losses summary",
                      status: "Generated",
                      date: "2024-01-15",
                    },
                    {
                      name: "Wash Sale Report",
                      description: "Detailed wash sale adjustments",
                      status: "Available",
                      date: "2024-01-10",
                    },
                  ].map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{doc.name}</div>
                          <div className="text-sm text-muted-foreground">{doc.description}</div>
                          <div className="text-xs text-muted-foreground">Generated: {doc.date}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={doc.status === "Available" ? "default" : "secondary"}>{doc.status}</Badge>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calculator" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tax Impact Calculator</CardTitle>
                <CardDescription>Estimate the tax impact of potential trades</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="symbol">Symbol</Label>
                      <Input id="symbol" placeholder="AAPL" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input id="quantity" type="number" placeholder="100" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="purchasePrice">Purchase Price</Label>
                      <Input id="purchasePrice" type="number" placeholder="150.00" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentPrice">Current Price</Label>
                      <Input id="currentPrice" type="number" placeholder="175.00" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="holdingPeriod">Holding Period</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select holding period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">Short-term (&lt;= 1 year)</SelectItem>
                          <SelectItem value="long">Long-term (&gt; 1 year)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full">
                      <Calculator className="h-4 w-4 mr-2" />
                      Calculate Tax Impact
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Estimated Results</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Unrealized Gain/Loss:</span>
                          <span className="text-green-600">+$2,500.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax Rate (Short-term):</span>
                          <span>22%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Estimated Tax:</span>
                          <span className="text-red-600">$550.00</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>Net After Tax:</span>
                          <span className="text-green-600">+$1,950.00</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg bg-muted/50">
                      <h4 className="font-medium mb-2">Tax Optimization Tip</h4>
                      <p className="text-sm text-muted-foreground">
                        If you hold this position for 3 more months to qualify for long-term capital gains, you could
                        save approximately $275 in taxes (15% vs 22% rate).
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
