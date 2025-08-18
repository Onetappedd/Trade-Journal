"use client"

import * as React from "react"
import * as Papa from "papaparse"
type TradeCsvRow = Record<string, string>;
type ParseResult<T> = {
  data: T[],
  errors: any[],
  meta: any,
};
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, CheckCircle, AlertCircle, Download, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ImportProgressModal } from "@/components/import/ImportProgressModal"

const WEBULL_OPTIONS_COLUMNS = [
  "Name", "Symbol", "Side", "Status", "Filled", "Total Qty", "Price", "Avg Price", "Time-in-Force", "Placed Time", "Filled Time"
]

const brokers = [
  { name: "Interactive Brokers", status: "Available" },
  { name: "TD Ameritrade", status: "Coming Soon" },
  { name: "E*TRADE", status: "Coming Soon" },
  { name: "Charles Schwab", status: "Coming Soon" },
  { name: "Fidelity", status: "Coming Soon" },
  { name: "Robinhood", status: "Coming Soon" },
]

const manualSchema = z.object({
  symbol: z.string().min(1, "Symbol is required"),
  side: z.enum(["buy", "sell"], { required_error: "Trade type is required" }),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  price: z.coerce.number().positive("Price must be positive"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
})
type ManualForm = z.infer<typeof manualSchema>

type TradePreview = {
  symbol: string
  side: string
  quantity: number
  entry_price: number
  entry_date: string
  status?: string
  validation_status?: string
  error?: string
  underlying?: string
  expiry?: string
  option_type?: string
  strike_price?: number
  full_symbol?: string
}

function parseOptionSymbol(symbol: string) {
  const match = symbol.match(/^([A-Z]+)(\d{2})(\d{2})(\d{2})([PC])(\d{8})$/)
  if (!match) return null
  const [_, underlying, yy, mm, dd, type, strikeRaw] = match
  const year = Number(yy) < 50 ? "20" + yy : "19" + yy
  const expiry = `${year}-${mm}-${dd}`
  const strike = parseInt(strikeRaw, 10) / 1000
  return {
    // Extract the actual underlying ticker (e.g., "ARM" from "ARM250703C00155000")
    underlying: underlying,
    expiry,
    option_type: type === "P" ? "put" : "call",
    strike_price: strike,
  }
}

function parseFilledTimeToISO(input: string): string | null {
  // Expected format: MM/DD/YYYY HH:mm:ss TZ (e.g., 07/02/2025 09:33:18 EDT)
  const m = input.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})\s+([A-Z]{3})$/)
  if (!m) return null
  const [, MM, DD, YYYY, hh, mm, ss, tz] = m
  const month = Number(MM)
  const day = Number(DD)
  const year = Number(YYYY)
  const hour = Number(hh)
  const minute = Number(mm)
  const second = Number(ss)
  // Map common US timezones to UTC offsets (hours)
  const offsets: Record<string, number> = {
    EST: -5, EDT: -4,
    CST: -6, CDT: -5,
    MST: -7, MDT: -6,
    PST: -8, PDT: -7,
  }
  const offset = offsets[tz]
  if (offset === undefined) return null
  // Convert local time to UTC by subtracting the timezone offset from local time: UTC = local - offset
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour - offset, minute, second))
  return utcDate.toISOString()
}

export default function ImportTradesPage() {
  const [csvFile, setCsvFile] = React.useState<File | null>(null)
  const [previewRows, setPreviewRows] = React.useState<TradePreview[]>([])
  const [parseError, setParseError] = React.useState<string | null>(null)
  const [processing, setProcessing] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [importSummary, setImportSummary] = React.useState<{ total: number, valid: number, errors: number, duplicates: number } | null>(null)
  const [broker, setBroker] = React.useState("Webull")
  const [assetType, setAssetType] = React.useState("Options")
  const { toast } = useToast()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  
  // Import progress modal state
  const [importModalOpen, setImportModalOpen] = React.useState(false)
  const [importProgress, setImportProgress] = React.useState(0)
  const [importStatus, setImportStatus] = React.useState<"importing" | "success" | "error">("importing")
  const [importResults, setImportResults] = React.useState({
    successCount: 0,
    errorCount: 0,
    duplicateCount: 0,
    errorMessage: ""
  })

  // Manual entry form
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const manualForm = useForm<ManualForm>({
    resolver: zodResolver(manualSchema),
    defaultValues: {
      symbol: "",
      side: "buy",
      quantity: 1,
      price: 0,
      date: new Date().toISOString().split('T')[0], // Today's date
      notes: "",
    },
  })

  // CSV Dropzone
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setParseError(null)
    setPreviewRows([])
    setImportSummary(null)
    setCsvFile(null)
    if (e.target.files?.[0]) {
      setCsvFile(e.target.files[0])
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setParseError(null)
    setPreviewRows([])
    setImportSummary(null)
    if (e.dataTransfer.files?.[0] && e.dataTransfer.files[0].name.endsWith(".csv")) {
      setCsvFile(e.dataTransfer.files[0])
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
  }

  // CSV Parsing
  function processFile() {
    if (!csvFile) return
    setProcessing(true)
    setProgress(0)
    setParseError(null)
    setPreviewRows([])
    setImportSummary(null)
    let progressVal = 0
    const progressInterval = setInterval(() => {
      progressVal += 10
      setProgress(Math.min(progressVal, 90))
    }, 100)
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results: ParseResult<TradeCsvRow>) => {
        clearInterval(progressInterval)
        setProgress(100)
        if (broker === "Webull" && assetType === "Options") {
          const columns = Object.keys((results.data as any[])[0] || {})
          const missing = WEBULL_OPTIONS_COLUMNS.filter((col) => !columns.includes(col))
          if (missing.length > 0) {
            setParseError("Missing columns: " + missing.join(", "))
            setProcessing(false)
            return
          }
          const seen = new Set<string>()
          const rows: TradePreview[] = []
          let valid = 0, errors = 0, duplicates = 0
          for (const row of results.data as any[]) {
            if (row.Status !== "Filled") continue
            const parsed = parseOptionSymbol(row.Symbol)
            const key = `${row.Symbol}-${row["Filled Time"]}`
            let status = "valid", error = undefined
            if (!row.Symbol || !row.Side || !row["Total Qty"] || !row["Avg Price"] || !row["Filled Time"]) {
              status = "error"
              error = "Missing required fields"
              errors++
            } else if (seen.has(key)) {
              status = "duplicate"
              duplicates++
            } else {
              valid++
              seen.add(key)
            }
            // For options, use the underlying as the symbol
            const symbolToUse = parsed ? parsed.underlying : row.Symbol
            
            rows.push({
              symbol: symbolToUse,  // Use underlying ticker as symbol
              side: (row.Side || "").toLowerCase(),
              quantity: Number(row["Total Qty"]),
              entry_price: Number(row["Avg Price"]),
              entry_date: parseFilledTimeToISO(row["Filled Time"]) || new Date(row["Filled Time"]).toISOString(),
              asset_type: "option",
              broker: broker,
              // Don't send status field - let database default handle it
              validation_status: status,  // Rename to avoid sending 'status' to DB
              error,
              ...parsed,
              full_symbol: row.Symbol,  // Keep the full option symbol for reference
            })
          }
          // If more than 1000 trades, show a warning and limit to 1000 for a single import request
          const MAX_UI_BATCH = 1000
          if (rows.length > MAX_UI_BATCH) {
            setParseError(`File contains ${rows.length} trades. For reliability, importing the first ${MAX_UI_BATCH} now. After this completes, upload the remaining trades.`)
            const limitedRows = rows.slice(0, MAX_UI_BATCH)
            const limitedValid = limitedRows.filter(r => r.validation_status === "valid").length
            const limitedErrors = limitedRows.filter(r => r.validation_status === "error").length
            const limitedDuplicates = limitedRows.filter(r => r.validation_status === "duplicate").length
            setPreviewRows(limitedRows)
            setImportSummary({ total: limitedRows.length, valid: limitedValid, errors: limitedErrors, duplicates: limitedDuplicates })
          } else {
            setPreviewRows(rows)
            setImportSummary({ total: rows.length, valid, errors, duplicates })
          }
        } else {
          setParseError("Only Webull + Options is supported in this version.")
        }
        setProcessing(false)
      },
      error: (err) => {
        clearInterval(progressInterval)
        setParseError(err.message)
        setProcessing(false)
      },
    })
  }

  function clearData() {
    setCsvFile(null)
    setPreviewRows([])
    setImportSummary(null)
    setProgress(0)
    setParseError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function downloadTemplate() {
    const csvContent =
      "Name,Symbol,Side,Status,Filled,Total Qty,Price,Avg Price,Time-in-Force,Placed Time,Filled Time\n" +
      "SPXW250702P06185000,SPXW250702P06185000,BUY,Filled,Yes,1,1.23,1.23,GTC,2025-07-01T13:00:00Z,2025-07-02T13:00:00Z"
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "webull_options_template.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  async function handleImport() {
    const valid = previewRows.filter((t) => t.validation_status === "valid")
    if (!valid.length) {
      toast({ title: "No valid trades to import", variant: "destructive" })
      return
    }
    
    // Open the progress modal
    setImportModalOpen(true)
    setImportStatus("importing")
    setImportProgress(0)
    setImportResults({
      successCount: 0,
      errorCount: 0,
      duplicateCount: 0,
      errorMessage: ""
    })
    
    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)
    
    try {
      const res = await fetch("/api/import-trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trades: valid }),
      })
      
      // Check if response is JSON
      let result
      const contentType = res.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        result = await res.json()
      } else {
        // If not JSON, try to get text and create error response
        const text = await res.text()
        console.error("Non-JSON response:", text)
        result = {
          error: text || "Server returned non-JSON response",
          success: 0,
          duplicates: 0,
          errors: [text || "Invalid server response"]
        }
      }
      console.log("Import result:", result)
      
      // Clear the progress interval and set to 100%
      clearInterval(progressInterval)
      setImportProgress(100)
      
      if (res.ok && result.success > 0) {
        // Set success status
        setImportStatus("success")
        setImportResults({
          successCount: result.success || 0,
          errorCount: result.error || 0,
          duplicateCount: result.duplicates || 0,
          errorMessage: ""
        })
        
        // Update trade statuses after successful import
        try {
          await fetch("/api/update-trade-status", { method: "POST" })
        } catch (e) {
          console.error("Failed to update trade statuses:", e)
        }
        
        // Clear the data after successful import (but wait for user to close modal)
        setTimeout(() => {
          if (importStatus === "success") {
            clearData()
          }
        }, 2000)
        
      } else if (res.ok && result.duplicates > 0) {
        // All duplicates case
        setImportStatus("success")
        setImportResults({
          successCount: 0,
          errorCount: 0,
          duplicateCount: result.duplicates,
          errorMessage: "All trades were duplicates"
        })
      } else {
        // Error case
        const errorMsg = result.errors ? result.errors.join(", ") : result.error || "Unknown error"
        setImportStatus("error")
        setImportResults({
          successCount: result.success || 0,
          errorCount: result.error || valid.length,
          duplicateCount: result.duplicates || 0,
          errorMessage: errorMsg
        })
        console.error("Import failed:", result)
      }
    } catch (e) {
      // Network or other error
      clearInterval(progressInterval)
      setImportProgress(100)
      setImportStatus("error")
      setImportResults({
        successCount: 0,
        errorCount: valid.length,
        duplicateCount: 0,
        errorMessage: String(e)
      })
      console.error("Import error:", e)
    }
  }
  
  // Handle modal close
  const handleModalClose = () => {
    setImportModalOpen(false)
    if (importStatus === "success") {
      clearData()
    }
  }

  // Manual Entry
  async function onManualSubmit(data: ManualForm) {
    setIsSubmitting(true)
    try {
      const parsed = parseOptionSymbol(data.symbol)
      const trade = {
        symbol: data.symbol,
        side: data.side,
        quantity: Number(data.quantity),
        entry_price: Number(data.price),
        entry_date: new Date(data.date).toISOString(),
        asset_type: parsed ? "option" : "stock",
        broker: "Manual",
        notes: data.notes || null,
        ...(parsed ? parsed : {}),
      }

      const res = await fetch("/api/import-trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trades: [trade] }),
      })

      const result = await res.json()
      
      if (res.ok && result.success > 0) {
        toast({ title: "Trade saved successfully!", variant: "default" })
        manualForm.reset({
          symbol: "",
          side: "buy",
          quantity: 1,
          price: 0,
          date: new Date().toISOString().split('T')[0],
          notes: "",
        })
      } else {
        // Show detailed error message
        const errorMsg = result.errors ? result.errors.join(", ") : result.error || "Unknown error"
        toast({ 
          title: "Failed to save trade", 
          description: errorMsg, 
          variant: "destructive" 
        })
        console.error("Trade save failed:", result)
      }
    } catch (e) {
      toast({ 
        title: "Failed to save trade", 
        description: String(e), 
        variant: "destructive" 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Import Trades</h1>
          <p className="text-muted-foreground">Import your trading data from CSV files or connect brokers</p>
          <nav className="mt-2 text-sm text-muted-foreground flex items-center gap-2" aria-label="Breadcrumb">
            <a href="/dashboard" className="hover:underline">Dashboard</a>
            <span>/</span>
            <a href="/dashboard/trades" className="hover:underline">Trades</a>
            <span>/</span>
            <span className="text-foreground">Import</span>
          </nav>
        </div>
        <Button variant="outline" onClick={downloadTemplate} className="shrink-0">
          <Download className="h-4 w-4 mr-2" aria-hidden />
          Download CSV Template
        </Button>
      </div>

      <Tabs defaultValue="csv" className="w-full">
        <TabsList className="w-full flex flex-wrap gap-2">
          <TabsTrigger value="csv">CSV Upload</TabsTrigger>
          <TabsTrigger value="broker">Broker Connect</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        {/* CSV Upload Tab */}
        <TabsContent value="csv" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV File</CardTitle>
              <CardDescription>Upload a CSV file exported from Webull (Options). Only filled trades will be imported.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dropzone */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                  csvFile ? "border-green-300 bg-green-50" : "border-gray-300 hover:border-gray-400"
                )}
                tabIndex={0}
                role="button"
                aria-label="Upload CSV file"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onKeyDown={e => (e.key === "Enter" || e.key === " ") && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  tabIndex={-1}
                />
                {csvFile ? (
                  <div className="space-y-2">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto" aria-hidden />
                    <p className="font-medium">{csvFile.name}</p>
                    <p className="text-sm text-muted-foreground">{(csvFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" aria-hidden />
                    <p className="font-medium">Drop your CSV file here or click to browse</p>
                    <p className="text-sm text-muted-foreground">Only .csv files are accepted</p>
                  </div>
                )}
              </div>

              {csvFile && !processing && previewRows.length === 0 && (
                <div className="flex gap-2">
                  <Button onClick={processFile} className="flex-1">
                    <FileText className="h-4 w-4 mr-2" aria-hidden />
                    Process File
                  </Button>
                  <Button onClick={clearData} variant="outline">
                    <Trash2 className="h-4 w-4 mr-2" aria-hidden />
                    Clear
                  </Button>
                </div>
              )}

              {processing && (
                <div className="space-y-2" aria-live="polite">
                  <div className="flex items-center justify-between text-sm">
                    <span>Processing file...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              {parseError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" aria-hidden />
                  <AlertDescription>{parseError}</AlertDescription>
                </Alert>
              )}

              {importSummary && (
                <Alert>
                  <AlertCircle className="h-4 w-4" aria-hidden />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Import Summary</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-medium tabular-nums">{importSummary.total}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Valid</p>
                          <p className="font-medium text-green-600 tabular-nums">{importSummary.valid}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Errors</p>
                          <p className="font-medium text-red-600 tabular-nums">{importSummary.errors}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Duplicates</p>
                          <p className="font-medium text-yellow-600 tabular-nums">{importSummary.duplicates}</p>
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {previewRows.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Preview Trades</h3>
                    <Button onClick={handleImport} disabled={importSummary?.valid === 0}>
                      Import {importSummary?.valid} Valid Trades
                    </Button>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Symbol</TableHead>
                            <TableHead>Side</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Underlying</TableHead>
                            <TableHead>Expiry</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Strike</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewRows.map((trade, i) => (
                            <TableRow key={i}>
                              <TableCell>{trade.symbol}</TableCell>
                              <TableCell><Badge variant={trade.side === "buy" ? "default" : "secondary"}>{trade.side.toUpperCase()}</Badge></TableCell>
                              <TableCell className="tabular-nums">{trade.quantity}</TableCell>
                              <TableCell className="tabular-nums">${trade.entry_price.toFixed(2)}</TableCell>
                              <TableCell>{new Date(trade.entry_date).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Badge variant={trade.validation_status === "valid" ? "default" : trade.validation_status === "error" ? "destructive" : "secondary"}>{trade.validation_status}</Badge>
                                {trade.error && <div className="text-xs text-red-600 mt-1">{trade.error}</div>}
                              </TableCell>
                              <TableCell>{trade.underlying || "-"}</TableCell>
                              <TableCell>{trade.expiry || "-"}</TableCell>
                              <TableCell>{trade.option_type ? trade.option_type.charAt(0).toUpperCase() + trade.option_type.slice(1) : "-"}</TableCell>
                              <TableCell>{trade.strike_price != null ? `${trade.strike_price.toFixed(2)}` : "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CSV Format Guide */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>CSV Format Guide</CardTitle>
              <CardDescription>Expected columns for Webull Options import:</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-6 text-sm space-y-1">
                {WEBULL_OPTIONS_COLUMNS.map(col => <li key={col}><span className="font-mono">{col}</span></li>)}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">Only rows with <span className="font-mono">Status = "Filled"</span> will be imported. Option symbols will be parsed for underlying, expiry, type, and strike.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Broker Connect Tab */}
        <TabsContent value="broker" className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" aria-hidden />
            <AlertDescription>Most broker integrations are coming soon. Only Interactive Brokers is available for connection at this time.</AlertDescription>
          </Alert>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brokers.map(broker => (
              <Card key={broker.name} className="p-4 flex flex-col gap-2 items-start">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{broker.name}</span>
                  <Badge variant={broker.status === "Available" ? "default" : "secondary"}>{broker.status}</Badge>
                </div>
                <Button className="mt-2" disabled={broker.status !== "Available"} variant={broker.status === "Available" ? "default" : "outline"}>
                  {broker.status === "Available" ? "Connect" : "Coming Soon"}
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Manual Entry Tab */}
        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Record New Trade</CardTitle>
              <CardDescription>Enter the details of your trade transaction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={manualForm.handleSubmit(onManualSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="symbol">Symbol</Label>
                    <Input 
                      id="symbol" 
                      placeholder="e.g., AAPL" 
                      {...manualForm.register("symbol")}
                    />
                    {manualForm.formState.errors.symbol && (
                      <span className="text-xs text-red-600">
                        {manualForm.formState.errors.symbol.message}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="side">Trade Type</Label>
                    <Select 
                      value={manualForm.watch("side")} 
                      onValueChange={(value) => manualForm.setValue("side", value as "buy" | "sell")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy">Buy</SelectItem>
                        <SelectItem value="sell">Sell</SelectItem>
                      </SelectContent>
                    </Select>
                    {manualForm.formState.errors.side && (
                      <span className="text-xs text-red-600">
                        {manualForm.formState.errors.side.message}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input 
                      id="quantity" 
                      type="number" 
                      placeholder="100" 
                      {...manualForm.register("quantity", { valueAsNumber: true })}
                    />
                    {manualForm.formState.errors.quantity && (
                      <span className="text-xs text-red-600">
                        {manualForm.formState.errors.quantity.message}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input 
                      id="price" 
                      type="number" 
                      step="0.01" 
                      placeholder="150.00" 
                      {...manualForm.register("price", { valueAsNumber: true })}
                    />
                    {manualForm.formState.errors.price && (
                      <span className="text-xs text-red-600">
                        {manualForm.formState.errors.price.message}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    {...manualForm.register("date")}
                  />
                  {manualForm.formState.errors.date && (
                    <span className="text-xs text-red-600">
                      {manualForm.formState.errors.date.message}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Add any notes about this trade..." 
                    {...manualForm.register("notes")}
                  />
                </div>

                <div className="flex space-x-4">
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Trade"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 bg-transparent"
                    onClick={() => manualForm.reset()}
                  >
                    Clear
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Import Progress Modal */}
      <ImportProgressModal
        isOpen={importModalOpen}
        onClose={handleModalClose}
        totalTrades={importSummary?.valid || 0}
        currentProgress={importProgress}
        status={importStatus}
        successCount={importResults.successCount}
        errorCount={importResults.errorCount}
        duplicateCount={importResults.duplicateCount}
        errorMessage={importResults.errorMessage}
      />
    </div>
  )
}
