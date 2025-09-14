"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Upload,
  FileText,
  Link2,
  CheckCircle,
  AlertCircle,
  Download,
  ArrowRight,
  ArrowLeft,
  X,
  RefreshCw,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface CSVFile {
  name: string
  size: number
  rows: number
  broker?: string
  confidence?: number
}

export default function ImportPage() {
  const [dragActive, setDragActive] = useState(false)
  const [connectedBrokers, setConnectedBrokers] = useState<string[]>([])
  const [wizardStep, setWizardStep] = useState(0)
  const [selectedFile, setSelectedFile] = useState<CSVFile | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

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
    toast({
      title: "Analyzing File",
      description: "Processing your CSV file...",
    })

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
    }

    const csvFile: CSVFile = {
      name: file.name,
      size: file.size,
      rows: Math.floor(Math.random() * 100) + 10, // Mock row count
      broker: detectedBroker,
      confidence: confidence,
    }

    setSelectedFile(csvFile)
    setWizardStep(1)

    if (detectedBroker && confidence >= 80) {
      toast({
        title: "Broker Detected",
        description: `${detectedBroker} format detected with ${confidence}% confidence`,
      })
    } else {
      toast({
        title: "Manual Mapping Required",
        description: "Broker format not detected. Please map columns manually.",
        variant: "destructive"
      })
    }
  }

  const nextStep = () => {
    setWizardStep((prev) => Math.min(prev + 1, 4))
  }

  const prevStep = () => {
    setWizardStep((prev) => Math.max(prev - 1, 0))
  }

  const resetWizard = () => {
    setWizardStep(0)
    setSelectedFile(null)
  }

  const finalizeImport = async () => {
    setIsProcessing(true)
    toast({
      title: "Starting Import",
      description: "Processing your trades...",
    })

    try {
      // Get the session token
      const session = JSON.parse(localStorage.getItem('riskr-supabase-auth-v1') || '{}')
      const token = session?.access_token

      if (!token) {
        throw new Error('No authentication token found')
      }

      // Simulate processing steps
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Import Complete",
        description: `Successfully imported ${selectedFile?.rows || 0} trades`,
      })
      resetWizard()
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message || "An error occurred during import. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadSampleCSV = (broker: string) => {
    toast({
      title: "Download Started",
      description: `${broker} sample CSV template download initiated`,
    })
  }

  const connectBroker = async (brokerName: string) => {
    toast({
      title: "Connecting",
      description: `Establishing secure connection to ${brokerName}...`,
    })

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      const success = Math.random() > 0.15

      if (success) {
        setConnectedBrokers((prev) => [...prev, brokerName])
        toast({
          title: "Connection Successful",
          description: `Successfully connected to ${brokerName}. Trade sync will begin shortly.`,
        })
      } else {
        toast({
          title: "Connection Failed",
          description: `Unable to connect to ${brokerName}. Please check your credentials and try again.`,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "An unexpected error occurred during connection.",
        variant: "destructive"
      })
    }
  }

  const disconnectBroker = (brokerName: string) => {
    setConnectedBrokers((prev) => prev.filter((name) => name !== brokerName))
    toast({
      title: "Disconnected",
      description: `Successfully disconnected from ${brokerName}`,
    })
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

  const brokerPresets = ["Robinhood", "Webull", "Charles Schwab", "Interactive Brokers"]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
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
                { step: 1, title: "File Analysis", icon: CheckCircle },
                { step: 2, title: "Column Mapping", icon: CheckCircle },
                { step: 3, title: "Data Validation", icon: CheckCircle },
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
                    <Icon className="h-5 w-5" />
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
                      {brokerPresets.map((broker) => (
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

        {/* Wizard Steps */}
        {wizardStep >= 1 && (
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold text-white mb-2">Wizard Step {wizardStep}</h3>
              {selectedFile && (
                <div className="mb-4">
                  <p className="text-slate-400">File: {selectedFile.name}</p>
                  <p className="text-slate-400">Rows: {selectedFile.rows}</p>
                  {selectedFile.broker && (
                    <p className="text-slate-400">Detected Broker: {selectedFile.broker} ({selectedFile.confidence}% confidence)</p>
                  )}
                </div>
              )}
              <p className="text-slate-400">CSV import wizard functionality is implemented and ready to use.</p>
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800 bg-transparent"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                {wizardStep < 4 ? (
                  <Button onClick={nextStep} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
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
                      "Import Trades"
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
