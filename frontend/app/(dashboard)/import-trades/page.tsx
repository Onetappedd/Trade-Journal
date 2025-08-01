"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { tradeApi } from "@/lib/api"

export default function ImportTrades() {
  const [broker, setBroker] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)

  const { toast } = useToast()

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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleImport = async () => {
    if (files.length === 0) {
      toast({
        title: "Error",
        description: "Please select files to import",
        variant: "destructive",
      })
      return
    }

    if (!broker) {
      toast({
        title: "Error",
        description: "Please select a broker",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("broker", broker)

        await tradeApi.importTrades(formData)
      }

      toast({
        title: "Success",
        description: `Imported ${files.length} file(s) successfully!`,
      })
      setFiles([])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import trades. Please check your file format.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Trades</h1>
        <p className="text-muted-foreground">Upload your trading data from various brokers</p>
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import Trades from CSV</CardTitle>
              <CardDescription>Upload your trading data from various brokers</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="stocks" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="stocks">Stock Import</TabsTrigger>
                  <TabsTrigger value="options">Options Import</TabsTrigger>
                </TabsList>

                <TabsContent value="stocks" className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="broker">Select Broker</Label>
                    <Select value={broker} onValueChange={setBroker}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose your broker" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="webull">Webull</SelectItem>
                        <SelectItem value="robinhood">Robinhood</SelectItem>
                        <SelectItem value="schwab">Charles Schwab</SelectItem>
                        <SelectItem value="ibkr">Interactive Brokers</SelectItem>
                        <SelectItem value="td">TD Ameritrade</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive
                        ? "border-primary bg-primary/10"
                        : "border-muted-foreground/25 hover:border-muted-foreground/50"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <div className="space-y-2">
                      <p className="text-lg font-medium">Drag and drop your CSV files here</p>
                      <p className="text-sm text-muted-foreground">or click to browse files</p>
                      <input
                        type="file"
                        multiple
                        accept=".csv"
                        onChange={handleFileInput}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload">
                        <Button variant="outline" className="mt-2 bg-transparent">
                          Browse Files
                        </Button>
                      </label>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="options" className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="broker">Select Broker</Label>
                    <Select value={broker} onValueChange={setBroker}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose your broker" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="webull">Webull</SelectItem>
                        <SelectItem value="robinhood">Robinhood</SelectItem>
                        <SelectItem value="schwab">Charles Schwab</SelectItem>
                        <SelectItem value="ibkr">Interactive Brokers</SelectItem>
                        <SelectItem value="td">TD Ameritrade</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive
                        ? "border-primary bg-primary/10"
                        : "border-muted-foreground/25 hover:border-muted-foreground/50"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <div className="space-y-2">
                      <p className="text-lg font-medium">Drag and drop your options CSV files here</p>
                      <p className="text-sm text-muted-foreground">or click to browse files</p>
                      <input
                        type="file"
                        multiple
                        accept=".csv"
                        onChange={handleFileInput}
                        className="hidden"
                        id="options-file-upload"
                      />
                      <label htmlFor="options-file-upload">
                        <Button variant="outline" className="mt-2 bg-transparent">
                          Browse Files
                        </Button>
                      </label>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* File Preview */}
              {files.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Selected Files</h3>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                    ))}
                  </div>

                  <Button onClick={handleImport} className="w-full mt-4" disabled={loading}>
                    {loading ? "Importing..." : `Import ${files.length} File${files.length > 1 ? "s" : ""}`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Import Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Import Summary</CardTitle>
              <CardDescription>Results from your last import</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">247</p>
                  <p className="text-sm text-muted-foreground">Imported</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-sm text-muted-foreground">Errors</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <FileText className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-sm text-muted-foreground">Skipped</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
