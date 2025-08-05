"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, Link } from "lucide-react"

interface ImportTradesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportTradesDialog({ open, onOpenChange }: ImportTradesDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [broker, setBroker] = useState("")

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleImport = () => {
    // Handle import logic
    console.log("Importing trades...")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Trades</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="csv" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="csv">CSV Upload</TabsTrigger>
            <TabsTrigger value="broker">Broker Connect</TabsTrigger>
          </TabsList>

          <TabsContent value="csv" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Upload CSV File</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-2">
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-500">Upload a file</span>
                    <span className="text-gray-500"> or drag and drop</span>
                  </Label>
                  <Input id="file-upload" type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </div>
                <p className="text-xs text-gray-500 mt-1">CSV up to 10MB</p>
              </div>
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  {selectedFile.name}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>CSV Format</Label>
              <p className="text-sm text-gray-600">
                Expected columns: Symbol, Side, Quantity, Entry Price, Entry Date, Exit Price, Exit Date, Notes
              </p>
            </div>
          </TabsContent>

          <TabsContent value="broker" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="broker">Select Broker</Label>
              <Select value={broker} onValueChange={setBroker}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your broker" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="td-ameritrade">TD Ameritrade</SelectItem>
                  <SelectItem value="schwab">Charles Schwab</SelectItem>
                  <SelectItem value="fidelity">Fidelity</SelectItem>
                  <SelectItem value="etrade">E*TRADE</SelectItem>
                  <SelectItem value="robinhood">Robinhood</SelectItem>
                  <SelectItem value="interactive-brokers">Interactive Brokers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-center py-4">
              <Link className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-sm text-gray-600 mt-2">Connect your broker account to automatically import trades</p>
            </div>

            <Button className="w-full" disabled={!broker}>
              Connect to {broker || "Broker"}
            </Button>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!selectedFile && !broker}>
            Import Trades
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
