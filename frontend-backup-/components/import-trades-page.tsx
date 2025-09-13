'use client';

import type React from 'react';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Upload, FileText, CheckCircle, AlertCircle, Download, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  date: string;
  fees?: number;
  status: 'valid' | 'error' | 'duplicate';
  error?: string;
}

export default function ImportTradesPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    total: number;
    successful: number;
    errors: number;
    duplicates: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setTrades([]);
      setImportResults(null);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      setSelectedFile(file);
      setTrades([]);
      setImportResults(null);
    }
  };

  const parseCSV = async (file: File): Promise<Trade[]> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

        const parsedTrades: Trade[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = line.split(',');
          const trade: Trade = {
            id: `import-${i}`,
            symbol: values[headers.indexOf('symbol')] || '',
            side: (values[headers.indexOf('side')] || 'buy').toLowerCase() as 'buy' | 'sell',
            quantity: Number.parseFloat(values[headers.indexOf('quantity')] || '0'),
            price: Number.parseFloat(values[headers.indexOf('price')] || '0'),
            date: values[headers.indexOf('date')] || new Date().toISOString(),
            fees: Number.parseFloat(values[headers.indexOf('fees')] || '0') || undefined,
            status: 'valid',
          };

          // Validate trade data
          if (!trade.symbol || trade.quantity <= 0 || trade.price <= 0) {
            trade.status = 'error';
            trade.error = 'Invalid trade data';
          }

          // Check for duplicates (simplified)
          const isDuplicate = parsedTrades.some(
            (t) =>
              t.symbol === trade.symbol &&
              t.quantity === trade.quantity &&
              t.price === trade.price &&
              t.date === trade.date,
          );

          if (isDuplicate) {
            trade.status = 'duplicate';
          }

          parsedTrades.push(trade);
        }

        resolve(parsedTrades);
      };
      reader.readAsText(file);
    });
  };

  const processFile = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const parsedTrades = await parseCSV(selectedFile);
      setTrades(parsedTrades);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Calculate results
      const results = {
        total: parsedTrades.length,
        successful: parsedTrades.filter((t) => t.status === 'valid').length,
        errors: parsedTrades.filter((t) => t.status === 'error').length,
        duplicates: parsedTrades.filter((t) => t.status === 'duplicate').length,
      };

      setImportResults(results);
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const importTrades = async () => {
    const validTrades = trades.filter((t) => t.status === 'valid');

    // Here you would typically send the trades to your API
    console.log('Importing trades:', validTrades);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Show success message or handle errors
    alert(`Successfully imported ${validTrades.length} trades!`);
  };

  const clearData = () => {
    setSelectedFile(null);
    setTrades([]);
    setImportResults(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const csvContent =
      'symbol,side,quantity,price,date,fees\nAAPL,buy,100,150.00,2024-01-15,1.00\nTSLA,sell,50,200.00,2024-01-16,1.50';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trade_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Import Trades</h1>
          <p className="text-muted-foreground">
            Import your trading data from CSV files or connect to brokers
          </p>
        </div>
        <Button onClick={downloadTemplate} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </div>

      <Tabs defaultValue="csv" className="space-y-6">
        <TabsList>
          <TabsTrigger value="csv">CSV Upload</TabsTrigger>
          <TabsTrigger value="broker">Broker Connection</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="csv" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV File</CardTitle>
              <CardDescription>
                Upload a CSV file containing your trade data. Make sure it includes columns for
                symbol, side, quantity, price, and date.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                  selectedFile
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400',
                )}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="space-y-2">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <p className="font-medium">Drop your CSV file here</p>
                    <p className="text-sm text-muted-foreground">or click to browse files</p>
                  </div>
                )}

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant={selectedFile ? 'secondary' : 'default'}
                  className="mt-4"
                >
                  {selectedFile ? 'Change File' : 'Select File'}
                </Button>
              </div>

              {selectedFile && !isProcessing && trades.length === 0 && (
                <div className="flex gap-2">
                  <Button onClick={processFile} className="flex-1">
                    <FileText className="h-4 w-4 mr-2" />
                    Process File
                  </Button>
                  <Button onClick={clearData} variant="outline">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              )}

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Processing file...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {importResults && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Import Summary</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-medium">{importResults.total}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Valid</p>
                          <p className="font-medium text-green-600">{importResults.successful}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Errors</p>
                          <p className="font-medium text-red-600">{importResults.errors}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Duplicates</p>
                          <p className="font-medium text-yellow-600">{importResults.duplicates}</p>
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {trades.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Preview Trades</h3>
                    <Button onClick={importTrades} disabled={importResults?.successful === 0}>
                      Import {importResults?.successful} Valid Trades
                    </Button>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-3">Symbol</th>
                            <th className="text-left p-3">Side</th>
                            <th className="text-left p-3">Quantity</th>
                            <th className="text-left p-3">Price</th>
                            <th className="text-left p-3">Date</th>
                            <th className="text-left p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trades.map((trade, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-3 font-medium">{trade.symbol}</td>
                              <td className="p-3">
                                <Badge variant={trade.side === 'buy' ? 'default' : 'secondary'}>
                                  {trade.side.toUpperCase()}
                                </Badge>
                              </td>
                              <td className="p-3">{trade.quantity}</td>
                              <td className="p-3">${trade.price.toFixed(2)}</td>
                              <td className="p-3">{new Date(trade.date).toLocaleDateString()}</td>
                              <td className="p-3">
                                <Badge
                                  variant={
                                    trade.status === 'valid'
                                      ? 'default'
                                      : trade.status === 'error'
                                        ? 'destructive'
                                        : 'secondary'
                                  }
                                >
                                  {trade.status}
                                </Badge>
                                {trade.error && (
                                  <p className="text-xs text-red-600 mt-1">{trade.error}</p>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="broker">
          <Card>
            <CardHeader>
              <CardTitle>Connect to Broker</CardTitle>
              <CardDescription>
                Connect your brokerage account to automatically import trades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Interactive Brokers', status: 'Available' },
                  { name: 'TD Ameritrade', status: 'Coming Soon' },
                  { name: 'E*TRADE', status: 'Coming Soon' },
                  { name: 'Charles Schwab', status: 'Coming Soon' },
                  { name: 'Fidelity', status: 'Coming Soon' },
                  { name: 'Robinhood', status: 'Coming Soon' },
                ].map((broker) => (
                  <Card key={broker.name} className="p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{broker.name}</h4>
                      <Badge variant={broker.status === 'Available' ? 'default' : 'secondary'}>
                        {broker.status}
                      </Badge>
                    </div>
                    <Button
                      className="w-full mt-3"
                      disabled={broker.status !== 'Available'}
                      variant={broker.status === 'Available' ? 'default' : 'outline'}
                    >
                      {broker.status === 'Available' ? 'Connect' : 'Coming Soon'}
                    </Button>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle>Manual Entry</CardTitle>
              <CardDescription>Manually enter trade data one by one</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input id="symbol" placeholder="AAPL" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="side">Side</Label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" type="number" placeholder="100" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input id="price" type="number" step="0.01" placeholder="150.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fees">Fees (Optional)</Label>
                  <Input id="fees" type="number" step="0.01" placeholder="1.00" />
                </div>
              </div>
              <Separator className="my-6" />
              <Button className="w-full">Add Trade</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
