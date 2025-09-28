"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Upload, FileText, Settings, CheckCircle, AlertTriangle, Database, Clock, Shield, Zap } from "lucide-react"

export default function ImportPage() {
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

        {/* Main Import Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Upload className="h-5 w-5 mr-2 text-emerald-400" />
                Upload CSV File
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="csv-file" className="text-slate-300">Select CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  className="mt-2 bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <Label htmlFor="broker-preset" className="text-slate-300">Broker Preset (Optional)</Label>
                <Select>
                  <SelectTrigger className="mt-2 bg-slate-800 border-slate-700 text-slate-100">
                    <SelectValue placeholder="Select your broker for automatic mapping" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interactive-brokers">Interactive Brokers</SelectItem>
                    <SelectItem value="td-ameritrade">TD Ameritrade</SelectItem>
                    <SelectItem value="etrade">E*TRADE</SelectItem>
                    <SelectItem value="schwab">Charles Schwab</SelectItem>
                    <SelectItem value="fidelity">Fidelity</SelectItem>
                    <SelectItem value="robinhood">Robinhood</SelectItem>
                    <SelectItem value="webull">Webull</SelectItem>
                    <SelectItem value="custom">Custom Format</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">Import Options</Label>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="skip-duplicates" className="text-slate-300">Skip Duplicates</Label>
                      <p className="text-sm text-slate-400">Prevent importing duplicate trades</p>
                    </div>
                    <Switch id="skip-duplicates" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="normalize-timestamps" className="text-slate-300">Normalize Timestamps</Label>
                      <p className="text-sm text-slate-400">Convert all timestamps to UTC</p>
                    </div>
                    <Switch id="normalize-timestamps" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="map-fees" className="text-slate-300">Map Fees & Commissions</Label>
                      <p className="text-sm text-slate-400">Automatically map fee columns</p>
                    </div>
                    <Switch id="map-fees" defaultChecked />
                  </div>
                </div>
              </div>

              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled>
                <FileText className="h-4 w-4 mr-2" />
                Start Import
              </Button>
            </CardContent>
          </Card>

          {/* Features Section */}
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Shield className="h-5 w-5 mr-2 text-blue-400" />
                Bulletproof Import Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                  <span className="text-slate-300">File size & MIME validation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Database className="h-5 w-5 text-blue-400" />
                  <span className="text-slate-300">Streaming/chunked parsing</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-purple-400" />
                  <span className="text-slate-300">Row-level idempotency</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-amber-400" />
                  <span className="text-slate-300">UTC timestamp normalization</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Settings className="h-5 w-5 text-cyan-400" />
                  <span className="text-slate-300">Broker preset support</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Zap className="h-5 w-5 text-emerald-400" />
                  <span className="text-slate-300">Real-time status updates</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Section */}
        <div className="mt-8">
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <AlertTriangle className="h-5 w-5 mr-2 text-amber-400" />
                Import Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400">No file selected. Please choose a CSV file to begin the import process.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
