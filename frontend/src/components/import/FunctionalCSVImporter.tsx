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
  stage: 'idle' | 'uploading' | 'parsing' | 'validating' | 'importing' | 'complete' | 'error';
  progress: number;
  message: string;
  error?: string;
  importedCount?: number;
  totalCount?: number;
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
      stage: 'uploading',
      progress: 10,
      message: 'Uploading file...',
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

            // First, debug the CSV parsing with Webull-specific logic
            const debugEndpoint = brokerPreset === 'webull' ? '/api/import/csv-webull-test' : '/api/import/csv-debug-detailed';
            const debugResponse = await fetch(debugEndpoint, {
              method: 'POST',
              body: formData,
              headers: {
                'Authorization': `Bearer ${session?.access_token}`,
              }
            });
            
            if (!debugResponse.ok) {
              const errorData = await debugResponse.json();
              throw new Error(errorData.message || 'Debug failed');
            }
            
            const debugData = await debugResponse.json();
            console.log('CSV Debug Data:', debugData);
            
            // Show debug info to user
            console.log('Full debug data:', debugData);
            console.log('Parsing results:', debugData.debug.parsingResults);
            console.log('Summary:', debugData.debug.summary);
            
            const summary = debugData.debug.summary;
            toast({
              title: 'CSV Analysis Complete',
              description: `Found ${debugData.debug.totalLines} lines. Valid trades: ${summary.validTrades}, Skipped: ${summary.skippedTrades}`,
              variant: 'default',
            });
            
            // Now try the actual import - use Webull-specific API if Webull preset is selected
            const apiEndpoint = brokerPreset === 'webull' ? '/api/import/csv-webull-final' : '/api/import/csv-fixed';
            console.log('Using API endpoint:', apiEndpoint);
            
            const uploadResponse = await fetch(apiEndpoint, {
              method: 'POST',
              body: formData,
              headers: {
                'Authorization': `Bearer ${session?.access_token}`,
              }
            });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.message || 'Upload failed');
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
  }, [selectedFile, brokerPreset, importOptions]);

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setBrokerPreset('');
    setImportStatus({
      stage: 'idle',
      progress: 0,
      message: 'No file selected. Please choose a CSV file to begin the import process.',
    });
    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
    </div>
  );
}
