"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Upload,
  FileText,
  Link2,
  CheckCircle,
  AlertCircle,
  Download,
  BarChart3,
  Bell,
  Settings,
  Search,
  ArrowRight,
  ArrowLeft,
  X,
  AlertTriangle,
  Info,
  TrendingUp,
  RefreshCw,
  Zap,
  Eye,
  FileCheck,
  Target,
} from "lucide-react"
import { showSuccess, showError, showInfo, showWarning } from "@/lib/notifications"

interface CSVFile {
  name: string
  size: number
  rows: number
  broker?: string
  confidence?: number
  data?: string[][]
  headers?: string[]
}

interface ColumnMapping {
  [key: string]: string
}

interface ValidationIssue {
  row: number
  column: string
  value: string
  issue: string
  suggestion?: string
  severity: "ERROR" | "WARNING" | "INFO"
  fixable: boolean
}

interface BrokerPreset {
  [key: string]: string[]
}

export default function ImportPage() {
  const [dragActive, setDragActive] = useState(false)
  const [connectedBrokers, setConnectedBrokers] = useState<string[]>([])

  const [wizardStep, setWizardStep] = useState(0)
  const [selectedFile, setSelectedFile] = useState<CSVFile | null>(null)
  const [mappingMode, setMappingMode] = useState<"preset" | "manual">("preset")
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({})
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewRows, setPreviewRows] = useState<string[][]>([])

  const brokerPresets: { [key: string]: BrokerPreset } = {
    Robinhood: {
      Date: ["date", "trade_date", "executed_at", "settlement_date"],
      Symbol: ["symbol", "ticker", "instrument", "security"],
      Side: ["side", "type", "action", "transaction_type"],
      Quantity: ["quantity", "qty", "shares", "amount"],
      Price: ["price", "executed_price", "fill_price", "avg_price"],
      Fees: ["fees", "commission", "regulatory_fees", "total_fees"],
    },
    Webull: {
      Date: ["date", "time", "trade_time", "execution_time"],
      Symbol: ["symbol", "ticker", "stock_symbol"],
      Side: ["side", "action", "buy_sell", "transaction"],
      Quantity: ["quantity", "shares", "qty"],
      Price: ["price", "avg_price", "execution_price"],
      Fees: ["fees", "commission", "total_commission"],
    },
    "Charles Schwab": {
      Date: ["date", "trade_date", "settlement_date"],
      Symbol: ["symbol", "security", "description"],
      Side: ["action", "transaction", "buy_sell"],
      Quantity: ["quantity", "shares"],
      Price: ["price", "net_price"],
      Fees: ["fees", "commission"],
    },
    "Interactive Brokers": {
      Date: ["date", "dateTime", "trade_date"],
      Symbol: ["symbol", "conid", "description"],
      Side: ["side", "buy_sell", "action"],
      Quantity: ["quantity", "shares"],
      Price: ["price", "tradePrice"],
      Fees: ["commission", "fees"],
    },
  }

  const mockCSVData = [
    ["Date", "Symbol", "Side", "Quantity", "Price", "Fees"],
    ["2024-01-15", "AAPL", "BUY", "100", "185.50", "1.00"],
    ["2024-01-16", "TSLA", "SELL", "50", "245.30", "1.25"],
    ["2024-01-17", "MSFT", "BUY", "75", "420.15", "0.75"],
    ["invalid-date", "GOOGL", "BUY", "25", "2850.00", "2.00"],
    ["2024-01-19", "", "SELL", "100", "155.75", "1.50"],
    ["2024-01-20", "NVDA", "BUY", "30", "875.25", "2.25"],
  ]

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    const csvFiles = files.filter((file) => file.name.endsWith(".csv"))

    if (csvFiles.length > 0) {
      processFileSelection(csvFiles[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      processFileSelection(files[0])
    }
  }

  const processFileSelection = (file: File) => {
    showInfo("Analyzing File", "Processing your CSV file...")

    const fileName = file.name.toLowerCase()
    let detectedBroker = ""
    let confidence = 0

    // Enhanced broker detection logic
    if (fileName.includes("robinhood") || fileName.includes("rh_") || fileName.includes("rh-")) {
      detectedBroker = "Robinhood"
      confidence = 95
    } else if (fileName.includes("webull") || fileName.includes("wb_") || fileName.includes("webull-")) {
      detectedBroker = "Webull"
      confidence = 90
    } else if (fileName.includes("schwab") || fileName.includes("cs_") || fileName.includes("charles")) {
      detectedBroker = "Charles Schwab"
      confidence = 85
    } else if (fileName.includes("ibkr") || fileName.includes("interactive") || fileName.includes("ib_")) {
      detectedBroker = "Interactive Brokers"
      confidence = 88
    } else {
      // Content-based detection fallback
      const headers = mockCSVData[0].map((h) => h.toLowerCase())
      if (headers.includes("executed_at") || headers.includes("settlement_date")) {
        detectedBroker = "Robinhood"
        confidence = 75
      } else if (headers.includes("trade_time") || headers.includes("execution_time")) {
        detectedBroker = "Webull"
        confidence = 70
      }
    }

    const csvFile: CSVFile = {
      name: file.name,
      size: file.size,
      rows: mockCSVData.length - 1,
      broker: detectedBroker,
      confidence: confidence,
      data: mockCSVData,
      headers: mockCSVData[0],
    }

    setSelectedFile(csvFile)
    setPreviewRows(mockCSVData.slice(1, 11)) // First 10 rows for preview
    setWizardStep(1)

    // Set default mapping mode based on detection confidence
    if (detectedBroker && confidence >= 80) {
      setMappingMode("preset")
      autoMapColumns(csvFile, detectedBroker)
      showSuccess("Broker Detected", `${detectedBroker} format detected with ${confidence}% confidence`)
    } else {
      setMappingMode("manual")
      showWarning("Manual Mapping Required", "Broker format not detected. Please map columns manually.")
    }
  }

  const autoMapColumns = (file: CSVFile, broker: string) => {
    if (!file.headers) return

    const headers = file.headers.map((h) => h.toLowerCase())
    const preset = brokerPresets[broker]
    const mapping: ColumnMapping = {}

    Object.entries(preset).forEach(([requiredField, possibleHeaders]) => {
      const matchedHeader = file.headers!.find((header) =>
        possibleHeaders.some(
          (possible) =>
            header.toLowerCase().includes(possible.toLowerCase()) ||
            possible.toLowerCase().includes(header.toLowerCase()),
        ),
      )
      if (matchedHeader) {
        mapping[requiredField] = matchedHeader
      }
    })

    setColumnMapping(mapping)
  }

  const validateData = () => {
    if (!selectedFile?.data) return

    showInfo("Validating Data", "Checking data quality and completeness...")

    const issues: ValidationIssue[] = []
    const data = selectedFile.data.slice(1)

    data.forEach((row, index) => {
      const actualRowIndex = index + 2

      // Date validation
      const dateColumn = columnMapping["Date"]
      if (dateColumn) {
        const dateIndex = selectedFile.data![0].indexOf(dateColumn)
        const dateValue = row[dateIndex]
        if (dateValue && !isValidDate(dateValue)) {
          issues.push({
            row: actualRowIndex,
            column: "Date",
            value: dateValue,
            issue: "Invalid date format",
            suggestion: "Use YYYY-MM-DD format (e.g., 2024-01-15)",
            severity: "ERROR",
            fixable: true,
          })
        }
      }

      // Symbol validation
      const symbolColumn = columnMapping["Symbol"]
      if (symbolColumn) {
        const symbolIndex = selectedFile.data![0].indexOf(symbolColumn)
        const symbolValue = row[symbolIndex]
        if (!symbolValue || symbolValue.trim() === "") {
          issues.push({
            row: actualRowIndex,
            column: "Symbol",
            value: symbolValue || "(empty)",
            issue: "Missing ticker symbol",
            suggestion: "Add a valid ticker symbol (e.g., AAPL, TSLA)",
            severity: "ERROR",
            fixable: false,
          })
        } else if (symbolValue.length > 10) {
          issues.push({
            row: actualRowIndex,
            column: "Symbol",
            value: symbolValue,
            issue: "Symbol too long",
            suggestion: "Use standard ticker symbols (max 10 characters)",
            severity: "WARNING",
            fixable: true,
          })
        }
      }

      // Price validation
      const priceColumn = columnMapping["Price"]
      if (priceColumn) {
        const priceIndex = selectedFile.data![0].indexOf(priceColumn)
        const priceValue = row[priceIndex]
        if (priceValue && (isNaN(Number(priceValue)) || Number(priceValue) <= 0)) {
          issues.push({
            row: actualRowIndex,
            column: "Price",
            value: priceValue,
            issue: "Invalid price value",
            suggestion: "Price must be a positive number",
            severity: "ERROR",
            fixable: true,
          })
        }
      }

      // Quantity validation
      const quantityColumn = columnMapping["Quantity"]
      if (quantityColumn) {
        const quantityIndex = selectedFile.data![0].indexOf(quantityColumn)
        const quantityValue = row[quantityIndex]
        if (quantityValue && (isNaN(Number(quantityValue)) || Number(quantityValue) <= 0)) {
          issues.push({
            row: actualRowIndex,
            column: "Quantity",
            value: quantityValue,
            issue: "Invalid quantity value",
            suggestion: "Quantity must be a positive number",
            severity: "ERROR",
            fixable: true,
          })
        }
      }
    })

    setValidationIssues(issues)
    setWizardStep(3)

    if (issues.length === 0) {
      showSuccess("Validation Complete", "All data passed validation checks!")
    } else {
      const errorCount = issues.filter((i) => i.severity === "ERROR").length
      const warningCount = issues.filter((i) => i.severity === "WARNING").length
      showWarning("Validation Issues Found", `${errorCount} errors and ${warningCount} warnings detected`)
    }
  }

  const isValidDate = (dateString: string): boolean => {
    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}$/)
  }

  const nextStep = () => {
    if (wizardStep === 2) {
      validateData()
    } else {
      setWizardStep((prev) => Math.min(prev + 1, 4))
    }
  }

  const prevStep = () => {
    setWizardStep((prev) => Math.max(prev - 1, 0))
  }

  const resetWizard = () => {
    setWizardStep(0)
    setSelectedFile(null)
    setColumnMapping({})
    setValidationIssues([])
    setMappingMode("preset")
    setPreviewRows([])
  }

  const finalizeImport = async () => {
    setIsProcessing(true)
    showInfo("Starting Import", "Processing your trades...")

    try {
      // Simulate processing steps
      await new Promise((resolve) => setTimeout(resolve, 1000))
      showInfo("Processing Data", "Validating and transforming trade data...")

      await new Promise((resolve) => setTimeout(resolve, 1500))
      showInfo("Saving Trades", "Importing trades to your portfolio...")

      await new Promise((resolve) => setTimeout(resolve, 1000))

      const errorCount = validationIssues.filter((i) => i.severity === "ERROR").length
      const successfulTrades = (selectedFile?.rows || 0) - errorCount
      const skippedTrades = errorCount

      showSuccess(
        "Import Complete",
        `Successfully imported ${successfulTrades} trades${skippedTrades > 0 ? `, ${skippedTrades} rows skipped due to errors` : ""}`,
      )
      resetWizard()
    } catch (error) {
      showError("Import Failed", "An error occurred during import. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadSampleCSV = (broker: string) => {
    showInfo("Download Started", `${broker} sample CSV template download initiated`)
    // In real implementation, this would download actual broker-specific templates
  }

  const connectBroker = async (brokerName: string) => {
    showInfo("Connecting", `Establishing secure connection to ${brokerName}...`)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      const success = Math.random() > 0.15

      if (success) {
        setConnectedBrokers((prev) => [...prev, brokerName])
        showSuccess("Connection Successful", `Successfully connected to ${brokerName}. Trade sync will begin shortly.`)
      } else {
        showError(
          "Connection Failed",
          `Unable to connect to ${brokerName}. Please check your credentials and try again.`,
        )
      }
    } catch (error) {
      showError("Connection Failed", "An unexpected error occurred during connection.")
    }
  }

  const disconnectBroker = (brokerName: string) => {
    setConnectedBrokers((prev) => prev.filter((name) => name !== brokerName))
    showSuccess("Disconnected", `Successfully disconnected from ${brokerName}`)
  }

  const brokers = [
    {
      name: "Interactive Brokers",
      logo: "🏦",
      status: "available",
      description: "Full API access with real-time data",
    },
    { name: "Charles Schwab", logo: "🏛️", status: "available", description: "Complete trade history and positions" },
    { name: "Robinhood", logo: "🏹", status: "available", description: "Commission-free trades and crypto" },
    { name: "Webull", logo: "🐂", status: "available", description: "Advanced charting and analysis" },
    { name: "TD Ameritrade", logo: "📈", status: "available", description: "Professional trading platform" },
    { name: "E*TRADE", logo: "💼", status: "available", description: "Comprehensive investment tools" },
    { name: "Fidelity", logo: "🛡️", status: "available", description: "Research and retirement planning" },
    { name: "Alpaca", logo: "🦙", status: "available", description: "Commission-free API trading" },
  ]

  const requiredFields = ["Date", "Symbol", "Side", "Quantity", "Price"]
  const optionalFields = ["Fees", "Notes", "Strategy"]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800/50 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-6">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <span className="text-lg sm:text-xl font-bold text-white tracking-tight">RiskR</span>
              </div>

              <nav className="hidden lg:flex items-center space-x-8">
                <a href="/dashboard" className="text-slate-400 hover:text-emerald-400 transition-colors font-medium">
                  Dashboard
                </a>
                <a href="/analytics" className="text-slate-400 hover:text-emerald-400 transition-colors font-medium">
                  Analytics
                </a>
                <a href="/import" className="text-emerald-400 font-medium border-b-2 border-emerald-400 pb-4">
                  Import Trades
                </a>
                <a href="/trades" className="text-slate-400 hover:text-emerald-400 transition-colors font-medium">
                  Trade History
                </a>
                <a href="/settings" className="text-slate-400 hover:text-emerald-400 transition-colors font-medium">
                  Settings
                </a>
              </nav>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search trades, symbols..."
                  className="pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 w-48 lg:w-64"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-slate-800 h-9 w-9 p-0"
              >
                <Bell className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-slate-800 h-9 w-9 p-0"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">JD</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-100 mb-2">Import Trades</h1>
          <p className="text-slate-400 text-sm sm:text-base lg:text-lg">
            Import your trading history from CSV files or connect your brokerage accounts
          </p>
        </div>

        {wizardStep > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-100">CSV Import Wizard</h2>
              <Button variant="ghost" size="sm" onClick={resetWizard} className="text-slate-400 hover:text-slate-200">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4 mb-6 overflow-x-auto pb-2">
              {[
                { step: 1, title: "File Analysis", icon: FileCheck },
                { step: 2, title: "Column Mapping", icon: Target },
                { step: 3, title: "Data Validation", icon: AlertCircle },
                { step: 4, title: "Import Confirmation", icon: CheckCircle },
              ].map(({ step, title, icon: Icon }) => (
                <div key={step} className="flex items-center flex-shrink-0">
                  <div
                    className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all
                    ${
                      wizardStep >= step
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : wizardStep === step - 1
                          ? "border-emerald-600 text-emerald-400 bg-emerald-600/10"
                          : "bg-slate-700 border-slate-600 text-slate-400"
                    }
                  `}
                  >
                    {wizardStep > step ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <div
                      className={`text-sm font-medium ${wizardStep >= step ? "text-emerald-400" : "text-slate-400"}`}
                    >
                      Step {step}
                    </div>
                    <div className={`text-xs ${wizardStep >= step ? "text-slate-300" : "text-slate-500"}`}>{title}</div>
                  </div>
                  {step < 4 && (
                    <div
                      className={`w-8 sm:w-12 h-0.5 ml-3 sm:ml-6 ${wizardStep > step ? "bg-emerald-600" : "bg-slate-700"}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {wizardStep === 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
            {/* CSV Import Section */}
            <div className="space-y-6">
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-100 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-emerald-400" />
                    CSV File Import
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Upload CSV files from your broker statements to import trade history
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div
                    className={`
                      relative border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-all duration-200
                      ${dragActive ? "border-emerald-400 bg-emerald-400/5" : "border-slate-600 hover:border-slate-500 bg-slate-800/30"}
                    `}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileInput}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="h-10 w-10 sm:h-12 sm:w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-slate-200 mb-2">
                      Drop CSV file here or click to browse
                    </h3>
                    <p className="text-slate-400 text-sm">Supports CSV files from major brokerages</p>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h4 className="font-medium text-slate-200 mb-3 flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Download Sample CSV Templates:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.keys(brokerPresets).map((broker) => (
                        <Button
                          key={broker}
                          variant="outline"
                          size="sm"
                          onClick={() => downloadSampleCSV(broker)}
                          className="border-slate-600 text-slate-300 hover:bg-slate-800 bg-transparent justify-start"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {broker}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Templates include proper column headers and sample data for each broker format
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Broker Connections Section */}
            <div className="space-y-6">
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-100 flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-emerald-400" />
                    Broker Connections
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Connect your brokerage accounts for automatic trade synchronization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {brokers.map((broker) => {
                    const isConnected = connectedBrokers.includes(broker.name)

                    return (
                      <div
                        key={broker.name}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors space-y-3 sm:space-y-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-2xl">{broker.logo}</div>
                          <div>
                            <h4 className="font-medium text-slate-200">{broker.name}</h4>
                            <p className="text-slate-400 text-sm">{broker.description}</p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                          {isConnected ? (
                            <>
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 self-start sm:self-center">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Connected
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => disconnectBroker(broker.name)}
                                className="border-slate-600 text-slate-300 hover:bg-slate-800 h-10 sm:h-auto"
                              >
                                Disconnect
                              </Button>
                            </>
                          ) : (
                            <Button
                              onClick={() => connectBroker(broker.name)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 sm:h-auto"
                            >
                              Connect
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {connectedBrokers.length > 0 && (
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-100 text-lg">Active Connections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {connectedBrokers.map((brokerName) => (
                        <div
                          key={brokerName}
                          className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20"
                        >
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                            <span className="text-slate-200">{brokerName}</span>
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          >
                            Syncing
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-amber-500/5 border-amber-500/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-amber-200 mb-1">Security & Privacy</h4>
                      <p className="text-amber-300/80 text-sm">
                        All connections use read-only access with bank-level encryption. We never store your login
                        credentials and cannot execute trades on your behalf.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {wizardStep === 1 && selectedFile && (
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-emerald-400" />
                File Analysis Summary
              </CardTitle>
              <CardDescription className="text-slate-400">
                Review your uploaded file details and detected broker format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-300 text-sm">Filename</Label>
                    <p className="text-slate-100 font-medium break-all">{selectedFile.name}</p>
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm">File Size</Label>
                    <p className="text-slate-100">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm">Total Rows</Label>
                    <p className="text-slate-100 flex items-center gap-2">
                      {selectedFile.rows} trades detected
                      <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                        {selectedFile.headers?.length || 0} columns
                      </Badge>
                    </p>
                  </div>
                </div>

                {selectedFile.broker ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-slate-300 text-sm">Detected Broker</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          {selectedFile.broker}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={`
                            ${
                              selectedFile.confidence! >= 90
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                : selectedFile.confidence! >= 75
                                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                  : "bg-slate-700 text-slate-300 border-slate-600"
                            }
                          `}
                        >
                          {selectedFile.confidence}% confidence
                        </Badge>
                      </div>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-emerald-400" />
                        <span className="text-emerald-300 text-sm">
                          Auto-mapping enabled for {selectedFile.broker} format
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-slate-300 text-sm">Broker Detection</Label>
                      <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30 mt-1">
                        Format not recognized
                      </Badge>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        <span className="text-amber-300 text-sm">Manual column mapping will be required</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-300 text-sm">Column Headers</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedFile.headers?.slice(0, 4).map((header, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-slate-600 text-slate-300">
                          {header}
                        </Badge>
                      ))}
                      {selectedFile.headers && selectedFile.headers.length > 4 && (
                        <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                          +{selectedFile.headers.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800 bg-transparent"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button onClick={nextStep} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Continue to Mapping
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {wizardStep === 2 && selectedFile && (
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-400" />
                Column Mapping
              </CardTitle>
              <CardDescription className="text-slate-400">
                Map your CSV columns to the required trade fields
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mapping Mode Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-3">
                  <Label className="text-slate-200 font-medium">Mapping Mode:</Label>
                  <Tabs value={mappingMode} onValueChange={(value) => setMappingMode(value as "preset" | "manual")}>
                    <TabsList className="bg-slate-700">
                      <TabsTrigger value="preset" className="data-[state=active]:bg-emerald-600">
                        <Zap className="h-4 w-4 mr-2" />
                        Preset
                      </TabsTrigger>
                      <TabsTrigger value="manual" className="data-[state=active]:bg-emerald-600">
                        <Eye className="h-4 w-4 mr-2" />
                        Manual
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                {mappingMode === "preset" && selectedFile.broker && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    {selectedFile.broker} Format
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Column Mapping */}
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-200">Field Mapping</h4>

                  {mappingMode === "preset" && selectedFile.broker ? (
                    <div className="space-y-3">
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                          <span className="text-emerald-300 text-sm font-medium">
                            Auto-mapped using {selectedFile.broker} preset
                          </span>
                        </div>
                        <p className="text-emerald-400/80 text-xs">
                          Fields have been automatically mapped based on {selectedFile.broker} format standards.
                        </p>
                      </div>

                      {requiredFields.map((field) => (
                        <div key={field} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                          <span className="text-slate-300 font-medium">{field} *</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                              {columnMapping[field] || "Not mapped"}
                            </Badge>
                            {columnMapping[field] && <CheckCircle className="h-4 w-4 text-emerald-400" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {requiredFields.map((field) => (
                        <div key={field} className="space-y-2">
                          <Label className="text-slate-300">{field} *</Label>
                          <Select
                            value={columnMapping[field] || ""}
                            onValueChange={(value) => setColumnMapping((prev) => ({ ...prev, [field]: value }))}
                          >
                            <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-200">
                              <SelectValue placeholder="Select column..." />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-600">
                              {selectedFile.headers?.map((header) => (
                                <SelectItem key={header} value={header} className="text-slate-200">
                                  {header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}

                      <div className="pt-4 border-t border-slate-700">
                        <h5 className="font-medium text-slate-300 mb-3">Optional Fields</h5>
                        {optionalFields.map((field) => (
                          <div key={field} className="space-y-2 mb-3">
                            <Label className="text-slate-400">{field}</Label>
                            <Select
                              value={columnMapping[field] || ""}
                              onValueChange={(value) => setColumnMapping((prev) => ({ ...prev, [field]: value }))}
                            >
                              <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-200">
                                <SelectValue placeholder="Select column..." />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-600">
                                <SelectItem value="" className="text-slate-400">
                                  None
                                </SelectItem>
                                {selectedFile.headers?.map((header) => (
                                  <SelectItem key={header} value={header} className="text-slate-200">
                                    {header}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Live Preview */}
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-200 flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Live Preview (First 10 Rows)
                  </h4>
                  <div className="bg-slate-800/50 rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-600">
                          {selectedFile.headers?.map((header) => (
                            <th key={header} className="text-left p-2 text-slate-300 min-w-[100px]">
                              <div className="flex flex-col gap-1">
                                <span>{header}</span>
                                {Object.entries(columnMapping).find(([_, mapped]) => mapped === header) && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs border-emerald-500/30 text-emerald-400 w-fit"
                                  >
                                    {Object.entries(columnMapping).find(([_, mapped]) => mapped === header)?.[0]}
                                  </Badge>
                                )}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.slice(0, 10).map((row, index) => (
                          <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="p-2 text-slate-200">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Validation warnings */}
              {requiredFields.some((field) => !columnMapping[field]) && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <span className="text-amber-300 text-sm">
                      Missing required field mappings:{" "}
                      {requiredFields.filter((field) => !columnMapping[field]).join(", ")}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800 bg-transparent"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={requiredFields.some((field) => !columnMapping[field])}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                >
                  Validate Data
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {wizardStep === 3 && (
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-emerald-400" />
                Data Validation Report
              </CardTitle>
              <CardDescription className="text-slate-400">
                Review data quality issues and suggested fixes before importing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {validationIssues.length === 0 ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-emerald-300 mb-2">All Data Valid!</h3>
                  <p className="text-emerald-400/80">No issues found in your trade data. Ready to import.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-red-400">
                        {validationIssues.filter((i) => i.severity === "ERROR").length}
                      </div>
                      <div className="text-red-300 text-sm">Errors</div>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-amber-400">
                        {validationIssues.filter((i) => i.severity === "WARNING").length}
                      </div>
                      <div className="text-amber-300 text-sm">Warnings</div>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {validationIssues.filter((i) => i.severity === "INFO").length}
                      </div>
                      <div className="text-blue-300 text-sm">Info</div>
                    </div>
                  </div>

                  {/* Issues List */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {validationIssues.map((issue, index) => (
                      <div
                        key={index}
                        className={`
                          rounded-lg p-4 border
                          ${
                            issue.severity === "ERROR"
                              ? "bg-red-500/10 border-red-500/20"
                              : issue.severity === "WARNING"
                                ? "bg-amber-500/10 border-amber-500/20"
                                : "bg-blue-500/10 border-blue-500/20"
                          }
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`
                            h-5 w-5 mt-0.5 flex-shrink-0
                            ${
                              issue.severity === "ERROR"
                                ? "text-red-400"
                                : issue.severity === "WARNING"
                                  ? "text-amber-400"
                                  : "text-blue-400"
                            }
                          `}
                          >
                            {issue.severity === "ERROR" ? (
                              <X className="h-5 w-5" />
                            ) : issue.severity === "WARNING" ? (
                              <AlertTriangle className="h-5 w-5" />
                            ) : (
                              <Info className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className={`
                                text-xs
                                ${
                                  issue.severity === "ERROR"
                                    ? "border-red-500/30 text-red-400"
                                    : issue.severity === "WARNING"
                                      ? "border-amber-500/30 text-amber-400"
                                      : "border-blue-500/30 text-blue-400"
                                }
                              `}
                              >
                                {issue.severity}
                              </Badge>
                              <span className="text-slate-300 font-medium">Row {issue.row}</span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-300">{issue.column}</span>
                              {issue.fixable && (
                                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs">
                                  Fixable
                                </Badge>
                              )}
                            </div>
                            <p
                              className={`
                              text-sm mb-1
                              ${
                                issue.severity === "ERROR"
                                  ? "text-red-200"
                                  : issue.severity === "WARNING"
                                    ? "text-amber-200"
                                    : "text-blue-200"
                              }
                            `}
                            >
                              {issue.issue}
                            </p>
                            <p className="text-slate-400 text-sm">Value: "{issue.value}"</p>
                            {issue.suggestion && (
                              <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-400 text-sm">
                                💡 {issue.suggestion}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800 bg-transparent"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Mapping
                </Button>
                <Button onClick={nextStep} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Continue to Import
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {wizardStep === 4 && selectedFile && (
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                Import Confirmation
              </CardTitle>
              <CardDescription className="text-slate-400">
                Review the final import summary before proceeding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                  <TrendingUp className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-slate-100">
                    {selectedFile.rows - validationIssues.filter((i) => i.severity === "ERROR").length}
                  </div>
                  <div className="text-slate-400 text-sm">Trades to Import</div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                  <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-slate-100">
                    {validationIssues.filter((i) => i.severity === "ERROR").length}
                  </div>
                  <div className="text-slate-400 text-sm">Rows to Skip</div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                  <AlertCircle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-slate-100">
                    {validationIssues.filter((i) => i.severity === "WARNING").length}
                  </div>
                  <div className="text-slate-400 text-sm">Warnings</div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                  <FileText className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-slate-100">{selectedFile.rows}</div>
                  <div className="text-slate-400 text-sm">Total Rows</div>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-medium text-slate-200 mb-3">Import Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">File:</span>
                      <span className="text-slate-200">{selectedFile.name}</span>
                    </div>
                    {selectedFile.broker && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Detected Format:</span>
                        <span className="text-slate-200">{selectedFile.broker}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mapping Mode:</span>
                      <span className="text-slate-200 capitalize">{mappingMode}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mapped Fields:</span>
                      <span className="text-slate-200">{Object.keys(columnMapping).length} fields</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Success Rate:</span>
                      <span className="text-emerald-400">
                        {(
                          ((selectedFile.rows - validationIssues.filter((i) => i.severity === "ERROR").length) /
                            selectedFile.rows) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {validationIssues.filter((i) => i.severity === "ERROR").length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-amber-400" />
                    <span className="text-amber-300 font-medium">Import Notice</span>
                  </div>
                  <p className="text-amber-200 text-sm">
                    {validationIssues.filter((i) => i.severity === "ERROR").length} row
                    {validationIssues.filter((i) => i.severity === "ERROR").length !== 1 ? "s" : ""} with critical
                    errors will be skipped during import. You can fix these issues and re-import the file later.
                  </p>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800 bg-transparent"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={finalizeImport}
                  disabled={isProcessing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      Import {selectedFile.rows - validationIssues.filter((i) => i.severity === "ERROR").length} Trades
                      <CheckCircle className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
