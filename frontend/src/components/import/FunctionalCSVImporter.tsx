'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Settings, 
  CheckCircle, 
  AlertTriangle,
  Database,
  Clock,
  Shield,
  Zap,
  X,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getSession } from '@/lib/auth';

interface ImportStatus {
  stage: 'idle' | 'uploading' | 'parsing' | 'validating' | 'preview' | 'importing' | 'complete' | 'error';
  progress: number;
  message: string;
  error?: string;
  importedCount?: number;
  totalCount?: number;
}

interface PreviewData {
  profiling: {
    totalRows: number;
    headerRows: number;
    parsedRows: number;
    filledRows: number;
    importedRows: number;
    skipped: {
      cancelled: number;
      zeroQty: number;
      zeroPrice: number;
      badDate: number;
      parseError: number;
    };
  };
  importableTradesPreview: Array<{
    externalId: string;
    broker: string;
    symbolRaw: string;
    symbol: string;
    assetType: string;
    side: string;
    quantity: number;
    price: number;
    fees: number;
    commission: number;
    status: string;
    executedAt: string;
    meta: {
      rowIndex: number;
      source: string;
    };
  }>;
  skippedRowsPreview: Array<{
    rowIndex: number;
    reason: string;
    symbolRaw: string;
    status: string;
    filled: string;
    price: string;
  }>;
  message: string;
}

interface ImportOptions {
  skipDuplicates: boolean;
  normalizeTimestamps: boolean;
  mapFees: boolean;
}

export function FunctionalCSVImporter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [brokerPreset, setBrokerPreset] = useState<string>('');
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    skipDuplicates: true,
    normalizeTimestamps: true,
    mapFees: true,
  });
  const [importStatus, setImportStatus] = useState<ImportStatus>({
    stage: 'idle',
    progress: 0,
    message: 'No file selected. Please choose a CSV file to begin the import process.',
  });
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast({
          title: 'Invalid File Type',
          description: 'Please select a CSV file.',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Please select a file smaller than 10MB.',
          variant: 'destructive',
        });
        return;
      }

      setSelectedFile(file);
      setImportStatus({
        stage: 'idle',
        progress: 0,
        message: `File selected: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`,
      });
    }
  }, []);

  const handleStartImport = useCallback(async () => {
    if (!selectedFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select a CSV file first.',
        variant: 'destructive',
      });
      return;
    }

    // Get session for authentication
    const session = await getSession();
    if (!session) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to import trades.',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    setImportStatus({
      stage: 'parsing',
      progress: 20,
      message: 'Analyzing CSV file...',
    });

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Call test endpoint to get preview data
      const testEndpoint = brokerPreset === 'webull' ? '/api/test-webull-import-simple' : '/api/import/csv-debug-detailed';
      const testResponse = await fetch(testEndpoint, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        }
      });
      
      if (!testResponse.ok) {
        const errorData = await testResponse.json();
        throw new Error(errorData.message || 'Analysis failed');
      }
      
      const testData = await testResponse.json();
      console.log('CSV Analysis Data:', testData);
      
      // Set preview data and show preview
      setPreviewData(testData);
      setShowPreview(true);
      setImportStatus({
        stage: 'preview',
        progress: 50,
        message: `Analysis complete. Found ${testData.profiling.importedRows} importable trades.`,
      });
      setIsImporting(false);
      
    } catch (error) {
      setImportStatus({
        stage: 'error',
        progress: 0,
        message: 'Analysis failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      setIsImporting(false);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  }, [selectedFile, brokerPreset, importOptions]);

  const handleConfirmImport = useCallback(async () => {
    if (!selectedFile || !previewData) {
      return;
    }

    // Get session for authentication
    const session = await getSession();
    if (!session) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to import trades.',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    setShowPreview(false);
    setImportStatus({
      stage: 'importing',
      progress: 70,
      message: 'Importing trades to database...',
    });

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('data', JSON.stringify({
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        broker: brokerPreset || 'csv',
        preset: brokerPreset,
        options: importOptions
      }));

      // Use final import endpoint
      const apiEndpoint = brokerPreset === 'webull' ? '/api/import/csv-webull-final' : '/api/import/csv-fixed';
      const uploadResponse = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        }
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.message || 'Import failed');
      }

      const uploadResult = await uploadResponse.json();
      
      if (uploadResult.success) {
        setImportStatus({
          stage: 'complete',
          progress: 100,
          message: `Import completed successfully! ${uploadResult.stats?.inserted || 0} trades imported.`,
          importedCount: uploadResult.stats?.inserted || 0,
          totalCount: uploadResult.stats?.totalRows || 0
        });
        setIsImporting(false);
        
        // Show success toast
        toast({
          title: 'Import Successful',
          description: `Successfully imported ${uploadResult.stats?.inserted || 0} trades.`,
          variant: 'default',
        });
        return;
      } else {
        throw new Error(uploadResult.error || 'Import failed');
      }

    } catch (error) {
      setImportStatus({
        stage: 'error',
        progress: 0,
        message: 'Import failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      setIsImporting(false);
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  }, [selectedFile, previewData, brokerPreset, importOptions]);

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setBrokerPreset('');
    setImportStatus({
      stage: 'idle',
      progress: 0,
      message: 'No file selected. Please choose a CSV file to begin the import process.',
    });
    setIsImporting(false);
    setPreviewData(null);
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleCancelPreview = useCallback(() => {
    setShowPreview(false);
    setPreviewData(null);
    setImportStatus({
      stage: 'idle',
      progress: 0,
      message: 'Preview cancelled. Ready to analyze another file.',
    });
  }, []);

  const getStatusIcon = () => {
    switch (importStatus.stage) {
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-emerald-400" />;
      case 'error':
        return <X className="h-5 w-5 text-red-400" />;
      case 'uploading':
      case 'parsing':
      case 'validating':
      case 'importing':
        return <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />;
      default:
        return <FileText className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusColor = () => {
    switch (importStatus.stage) {
      case 'complete':
        return 'text-emerald-400';
      case 'error':
        return 'text-red-400';
      case 'uploading':
      case 'parsing':
      case 'validating':
      case 'importing':
        return 'text-blue-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-8">
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
              ref={fileInputRef}
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="mt-2 bg-slate-800 border-slate-700 text-slate-100"
              disabled={isImporting}
            />
            {selectedFile && (
              <div className="mt-2 p-2 bg-slate-800/50 rounded border border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-emerald-400" />
                    <span className="text-slate-300 text-sm">{selectedFile.name}</span>
                    <Badge variant="secondary" className="bg-emerald-950/50 text-emerald-400">
                      {(selectedFile.size / 1024).toFixed(1)}KB
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    disabled={isImporting}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="broker-preset" className="text-slate-300">Broker Preset (Optional)</Label>
            <Select value={brokerPreset} onValueChange={setBrokerPreset} disabled={isImporting}>
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
                <Switch
                  id="skip-duplicates"
                  checked={importOptions.skipDuplicates}
                  onCheckedChange={(checked) => setImportOptions(prev => ({ ...prev, skipDuplicates: checked }))}
                  disabled={isImporting}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="normalize-timestamps" className="text-slate-300">Normalize Timestamps</Label>
                  <p className="text-sm text-slate-400">Convert all timestamps to UTC</p>
                </div>
                <Switch
                  id="normalize-timestamps"
                  checked={importOptions.normalizeTimestamps}
                  onCheckedChange={(checked) => setImportOptions(prev => ({ ...prev, normalizeTimestamps: checked }))}
                  disabled={isImporting}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="map-fees" className="text-slate-300">Map Fees & Commissions</Label>
                  <p className="text-sm text-slate-400">Automatically map fee columns</p>
                </div>
                <Switch
                  id="map-fees"
                  checked={importOptions.mapFees}
                  onCheckedChange={(checked) => setImportOptions(prev => ({ ...prev, mapFees: checked }))}
                  disabled={isImporting}
                />
              </div>
            </div>
          </div>

          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleStartImport}
            disabled={!selectedFile || isImporting}
          >
            {isImporting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Start Import
              </>
            )}
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

      {/* Status Section */}
      <Card className="bg-slate-900/50 border-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            {getStatusIcon()}
            <span className={`ml-2 ${getStatusColor()}`}>Import Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">{importStatus.message}</span>
              {importStatus.importedCount !== undefined && importStatus.totalCount !== undefined && (
                <Badge variant="secondary" className="bg-blue-950/50 text-blue-400">
                  {importStatus.importedCount}/{importStatus.totalCount}
                </Badge>
              )}
            </div>
            
            {importStatus.stage !== 'idle' && importStatus.stage !== 'complete' && importStatus.stage !== 'error' && (
              <Progress value={importStatus.progress} className="w-full" />
            )}
            
            {importStatus.error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{importStatus.error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {showPreview && previewData && (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-400" />
              Import Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profiling Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-emerald-400">{previewData.profiling.importedRows}</div>
                <div className="text-sm text-slate-400">Importable</div>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-400">{previewData.profiling.skipped.cancelled}</div>
                <div className="text-sm text-slate-400">Cancelled</div>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400">{previewData.profiling.skipped.zeroQty + previewData.profiling.skipped.zeroPrice}</div>
                <div className="text-sm text-slate-400">Zero Values</div>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-slate-400">{previewData.profiling.totalRows}</div>
                <div className="text-sm text-slate-400">Total Rows</div>
              </div>
            </div>

            {/* Warning for zero importable rows */}
            {previewData.profiling.importedRows === 0 && (
              <Alert className="border-yellow-500/50 bg-yellow-950/20">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-200">
                  Most rows are Cancelled/zero-filled. Nothing to import.
                </AlertDescription>
              </Alert>
            )}

            {/* Importable Trades Preview */}
            {previewData.importableTradesPreview.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">Importable Trades Preview</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {previewData.importableTradesPreview.map((trade, index) => (
                    <div key={index} className="bg-slate-800/50 p-3 rounded-lg text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-400 font-medium">{trade.symbol}</span>
                        <span className="text-slate-300">{trade.side.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between text-slate-400 mt-1">
                        <span>Qty: {trade.quantity}</span>
                        <span>Price: ${trade.price}</span>
                        <span>Date: {new Date(trade.executedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skipped Rows Preview */}
            {previewData.skippedRowsPreview.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">Skipped Rows Preview</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {previewData.skippedRowsPreview.map((row, index) => (
                    <div key={index} className="bg-slate-800/50 p-3 rounded-lg text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-red-400 font-medium">Row {row.rowIndex}</span>
                        <Badge variant="destructive" className="text-xs">
                          {row.reason}
                        </Badge>
                      </div>
                      <div className="text-slate-400 mt-1">
                        Symbol: {row.symbolRaw} | Status: {row.status} | Price: {row.price}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              {previewData.profiling.importedRows > 0 ? (
                <Button
                  onClick={handleConfirmImport}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={isImporting}
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Import {previewData.profiling.importedRows} Trades
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleCancelPreview}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
                >
                  <X className="h-4 w-4 mr-2" />
                  Close Preview
                </Button>
              )}
              <Button
                onClick={handleCancelPreview}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
