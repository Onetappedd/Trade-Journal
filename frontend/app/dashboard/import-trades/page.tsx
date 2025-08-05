"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ImportTradesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Import Trades</h2>
        <p className="text-muted-foreground">Upload your trading data from CSV files or broker exports</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CSV File
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Import trades from a CSV file with columns: Symbol, Type, Quantity, Price, Date
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv-file">Select CSV File</Label>
              <Input id="csv-file" type="file" accept=".csv" />
            </div>
            <Button className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              Upload and Process
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Broker Integration
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Connect your brokerage account to automatically import trades
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Broker integrations are coming soon. For now, please use CSV import.</AlertDescription>
            </Alert>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" disabled>
                Connect TD Ameritrade
              </Button>
              <Button variant="outline" disabled>
                Connect Interactive Brokers
              </Button>
              <Button variant="outline" disabled>
                Connect Robinhood
              </Button>
              <Button variant="outline" disabled>
                Connect E*TRADE
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
