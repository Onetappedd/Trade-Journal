"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Download, AlertTriangle, Calculator, TrendingUp, DollarSign, Calendar } from "lucide-react"

// Mock tax data
const taxSummary = {
  totalGains: 15420.5,
  totalLosses: -8930.25,
  netGains: 6490.25,
  shortTermGains: 12340.75,
  longTermGains: 3079.75,
  shortTermLosses: -6540.5,
  longTermLosses: -2389.75,
  washSales: 2450.0,
  estimatedTax: 1622.56,
}

const washSaleTransactions = [
  {
    symbol: "AAPL",
    sellDate: "2023-11-15",
    buyDate: "2023-11-28",
    loss: -450.0,
    washSaleAmount: 450.0,
    status: "Active",
  },
  {
    symbol: "TSLA",
    sellDate: "2023-10-22",
    buyDate: "2023-11-05",
    loss: -890.0,
    washSaleAmount: 890.0,
    status: "Active",
  },
  {
    symbol: "NVDA",
    sellDate: "2023-09-18",
    buyDate: "2023-10-01",
    loss: -1110.0,
    washSaleAmount: 1110.0,
    status: "Resolved",
  },
]

const taxLotData = [
  {
    symbol: "AAPL",
    purchaseDate: "2023-01-15",
    shares: 100,
    costBasis: 150.0,
    currentPrice: 182.25,
    unrealizedGL: 3225.0,
    holdingPeriod: "Long-term",
  },
  {
    symbol: "NVDA",
    purchaseDate: "2023-08-22",
    shares: 50,
    costBasis: 420.0,
    currentPrice: 445.8,
    unrealizedGL: 1290.0,
    holdingPeriod: "Short-term",
  },
  {
    symbol: "TSLA",
    purchaseDate: "2023-03-10",
    shares: 75,
    costBasis: 245.0,
    currentPrice: 238.9,
    unrealizedGL: -457.5,
    holdingPeriod: "Long-term",
  },
]

const monthlyTaxData = [
  { month: "Jan", shortTerm: 2450, longTerm: 890 },
  { month: "Feb", shortTerm: -1200, longTerm: 450 },
  { month: "Mar", shortTerm: 3400, longTerm: 1200 },
  { month: "Apr", shortTerm: 1800, longTerm: -300 },
  { month: "May", shortTerm: 2100, longTerm: 800 },
  { month: "Jun", shortTerm: -890, longTerm: 340 },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

export default function TaxCenter() {
  const [taxYear, setTaxYear] = useState("2023")

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getPLColor = (value: number) => {
    return value >= 0 ? "text-green-600" : "text-red-600"
  }

  const exportTaxDocuments = (format: string) => {
    console.log(`Exporting tax documents as ${format}`)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tax Center</h1>
          <p className="text-muted-foreground">Manage your trading taxes and generate reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={taxYear} onValueChange={setTaxYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
              <SelectItem value="2021">2021</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => exportTaxDocuments("pdf")}>
            <Download className="mr-2 h-4 w-4" />
            Export 1099
          </Button>
        </div>
      </div>

      {/* Tax Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Capital Gains</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPLColor(taxSummary.netGains)}`}>
              {formatCurrency(taxSummary.netGains)}
            </div>
            <p className="text-xs text-muted-foreground">
              {taxSummary.netGains >= 0 ? "Taxable gains" : "Tax loss carryforward"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Short-term Gains</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPLColor(taxSummary.shortTermGains)}`}>
              {formatCurrency(taxSummary.shortTermGains)}
            </div>
            <p className="text-xs text-muted-foreground">Taxed as ordinary income</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Long-term Gains</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPLColor(taxSummary.longTermGains)}`}>
              {formatCurrency(taxSummary.longTermGains)}
            </div>
            <p className="text-xs text-muted-foreground">Preferential tax rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Tax</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(taxSummary.estimatedTax)}</div>
            <p className="text-xs text-muted-foreground">Based on 25% rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Wash Sale Alert */}
      {taxSummary.washSales > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Wash Sale Alert</AlertTitle>
          <AlertDescription>
            You have {formatCurrency(taxSummary.washSales)} in wash sale adjustments. These losses are deferred and
            added to your cost basis.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="wash-sales">Wash Sales</TabsTrigger>
          <TabsTrigger value="tax-lots">Tax Lots</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Gains/Losses Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Capital Gains Breakdown</CardTitle>
                <CardDescription>Short-term vs long-term gains/losses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyTaxData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), ""]} />
                    <Bar dataKey="shortTerm" fill="#8884d8" name="Short-term" />
                    <Bar dataKey="longTerm" fill="#82ca9d" name="Long-term" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tax Liability Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Tax Liability Distribution</CardTitle>
                <CardDescription>Breakdown of taxable events</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Short-term Gains", value: Math.abs(taxSummary.shortTermGains), color: "#0088FE" },
                        { name: "Long-term Gains", value: Math.abs(taxSummary.longTermGains), color: "#00C49F" },
                        { name: "Short-term Losses", value: Math.abs(taxSummary.shortTermLosses), color: "#FFBB28" },
                        { name: "Long-term Losses", value: Math.abs(taxSummary.longTermLosses), color: "#FF8042" },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[0, 1, 2, 3].map((index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tax Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle>Tax Summary Details</CardTitle>
              <CardDescription>Detailed breakdown for tax filing</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Tax Rate</TableHead>
                    <TableHead>Tax Owed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Short-term Capital Gains</TableCell>
                    <TableCell className="text-green-600">{formatCurrency(taxSummary.shortTermGains)}</TableCell>
                    <TableCell>25%</TableCell>
                    <TableCell className="text-orange-600">
                      {formatCurrency(taxSummary.shortTermGains * 0.25)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Long-term Capital Gains</TableCell>
                    <TableCell className="text-green-600">{formatCurrency(taxSummary.longTermGains)}</TableCell>
                    <TableCell>15%</TableCell>
                    <TableCell className="text-orange-600">{formatCurrency(taxSummary.longTermGains * 0.15)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Short-term Capital Losses</TableCell>
                    <TableCell className="text-red-600">{formatCurrency(taxSummary.shortTermLosses)}</TableCell>
                    <TableCell>-25%</TableCell>
                    <TableCell className="text-green-600">
                      {formatCurrency(Math.abs(taxSummary.shortTermLosses * 0.25))}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Long-term Capital Losses</TableCell>
                    <TableCell className="text-red-600">{formatCurrency(taxSummary.longTermLosses)}</TableCell>
                    <TableCell>-15%</TableCell>
                    <TableCell className="text-green-600">
                      {formatCurrency(Math.abs(taxSummary.longTermLosses * 0.15))}
                    </TableCell>
                  </TableRow>
                  <TableRow className="font-bold">
                    <TableCell>Total Estimated Tax</TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-orange-600">{formatCurrency(taxSummary.estimatedTax)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wash-sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Wash Sale Transactions</CardTitle>
              <CardDescription>
                Transactions subject to wash sale rules (selling and repurchasing within 30 days)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Sell Date</TableHead>
                    <TableHead>Repurchase Date</TableHead>
                    <TableHead>Loss Disallowed</TableHead>
                    <TableHead>Wash Sale Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {washSaleTransactions.map((transaction, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Badge variant="outline">{transaction.symbol}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(transaction.sellDate)}</TableCell>
                      <TableCell>{formatDate(transaction.buyDate)}</TableCell>
                      <TableCell className="text-red-600">{formatCurrency(transaction.loss)}</TableCell>
                      <TableCell className="text-orange-600">{formatCurrency(transaction.washSaleAmount)}</TableCell>
                      <TableCell>
                        <Badge variant={transaction.status === "Active" ? "destructive" : "default"}>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Wash Sale Rules</AlertTitle>
            <AlertDescription>
              The wash sale rule prevents you from claiming a tax deduction for a security sold at a loss if you
              purchase the same or substantially identical security within 30 days before or after the sale. The
              disallowed loss is added to the cost basis of the repurchased security.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="tax-lots" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax Lot Analysis</CardTitle>
              <CardDescription>Current holdings with unrealized gains/losses</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>Shares</TableHead>
                    <TableHead>Cost Basis</TableHead>
                    <TableHead>Current Price</TableHead>
                    <TableHead>Unrealized G/L</TableHead>
                    <TableHead>Holding Period</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxLotData.map((lot, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Badge variant="outline">{lot.symbol}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(lot.purchaseDate)}</TableCell>
                      <TableCell>{lot.shares}</TableCell>
                      <TableCell>{formatCurrency(lot.costBasis)}</TableCell>
                      <TableCell>{formatCurrency(lot.currentPrice)}</TableCell>
                      <TableCell className={getPLColor(lot.unrealizedGL)}>{formatCurrency(lot.unrealizedGL)}</TableCell>
                      <TableCell>
                        <Badge variant={lot.holdingPeriod === "Long-term" ? "default" : "secondary"}>
                          {lot.holdingPeriod}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax Optimization Strategies</CardTitle>
              <CardDescription>Recommendations to minimize your tax liability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="font-semibold text-green-800 dark:text-green-400 mb-2">
                  Tax Loss Harvesting Opportunity
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  You have unrealized losses of $457.50 in TSLA. Consider selling to offset gains and reduce your tax
                  liability by approximately $114.38.
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">
                  Long-term Capital Gains Strategy
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Your AAPL position will qualify for long-term capital gains treatment. Consider holding until after
                  the one-year mark to benefit from lower tax rates.
                </p>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-400 mb-2">Wash Sale Prevention</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Avoid repurchasing securities within 30 days of selling at a loss. Consider similar but not
                  substantially identical alternatives.
                </p>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h4 className="font-semibold text-purple-800 dark:text-purple-400 mb-2">Year-end Planning</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  With 2 months left in the tax year, consider realizing losses to offset your current gains of
                  $6,490.25 and reduce your estimated tax liability.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tax Efficiency Score</CardTitle>
              <CardDescription>How tax-efficient is your trading strategy?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Overall Tax Efficiency</span>
                  <span className="font-medium">72%</span>
                </div>
                <Progress value={72} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  Good - You're utilizing tax-advantaged strategies effectively
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Long-term Holdings Ratio</span>
                  <span className="font-medium">45%</span>
                </div>
                <Progress value={45} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  Consider holding positions longer for preferential tax treatment
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Loss Harvesting Utilization</span>
                  <span className="font-medium">85%</span>
                </div>
                <Progress value={85} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  Excellent - You're effectively using losses to offset gains
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
