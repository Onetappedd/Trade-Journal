'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImportStatusCard } from './ImportStatusCard';
import { toast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  Settings, 
  CheckCircle, 
  AlertTriangle,
  Database,
  Clock,
  RefreshCw
} from 'lucide-react';

interface ImportOptions {
  skipDuplicates: boolean;
  normalizeTimestamps: boolean;
  mapFees: boolean;
}

interface BrokerPreset {
  id: string;
  name: string;
  description: string;
  mapping: Record<string, string>;
}

const BROKER_PRESETS: BrokerPreset[] = [
  {
    id: 'etrade',
    name: 'E*TRADE',
    description: 'E*TRADE CSV format',
    mapping: {
      symbol: 'Symbol',
      side: 'Action',
      quantity: 'Quantity',
      price: 'Price',
      date: 'Date',
      fees: 'Commission'
    }
  },
  {
    id: 'td_ameritrade',
    name: 'TD Ameritrade',
    description: 'TD Ameritrade CSV format',
    mapping: {
      symbol: 'Symbol',
      side: 'Side',
      quantity: 'Quantity',
      price: 'Price',
      date: 'Date',
      fees: 'Commission'
    }
  },
  {
    id: 'schwab',
    name: 'Charles Schwab',
    description: 'Charles Schwab CSV format',
    mapping: {
      symbol: 'Symbol',
      side: 'Action',
      quantity: 'Quantity',
      price: 'Price',
      date: 'Date',
      fees: 'Commission'
    }
  },
  {
    id: 'fidelity',
    name: 'Fidelity',
    description: 'Fidelity CSV format',
    mapping: {
      symbol: 'Symbol',
      side: 'Action',
      quantity: 'Quantity',
      price: 'Price',
      date: 'Date',
      fees: 'Commission'
    }
  },
  {
    id: 'robinhood',
    name: 'Robinhood',
    description: 'Robinhood CSV format',
    mapping: {
      symbol: 'Symbol',
      side: 'Side',
      quantity: 'Quantity',
      price: 'Price',
      date: 'Date',
      fees: 'Commission'
    }
  }
];

export function BulletproofCSVImporter() {
  const { user, session } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    skipDuplicates: true,
    normalizeTimestamps: true,
    mapFees: true
  });
  const [isUploading, setIsUploading] = useState(false);
  const [importRunId, setImportRunId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadError('Please select a CSV file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB
      setUploadError('File size must be less than 50MB');
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
  }, []);

  const handleStartImport = useCallback(async () => {
    if (!selectedFile || !user || !session) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('data', JSON.stringify({
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        broker: selectedPreset || undefined,
        preset: selectedPreset || undefined,
        mapping: selectedPreset ? BROKER_PRESETS.find(p => p.id === selectedPreset)?.mapping : undefined,
        options: importOptions
      }));

      // Upload file
      const response = await fetch('/api/import/csv', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      setImportRunId(result.importRunId);

      toast({
        title: "Import Started",
        description: "Your CSV file is being processed. You can monitor the progress below.",
        "data-testid": "toast-success"
      });

    } catch (error) {
      console.error('Import error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
        "data-testid": "toast-error"
      });
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, user, session, selectedPreset, importOptions]);

  const handleRetry = useCallback(() => {
    setImportRunId(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleImportComplete = useCallback(() => {
    toast({
      title: "Import Completed",
      description: "Your trades have been imported successfully and are being matched.",
      "data-testid": "toast-success"
    });
  }, []);

  if (!user) {
    return (
      <Card className="bg-slate-900/50 border-slate-800/50">
        <CardContent className="p-6">
          <Alert className="bg-yellow-900/20 border-yellow-500/30">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please log in to import your trading data.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      {!importRunId && (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Upload className="h-5 w-5" />
              <span>Upload CSV File</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Input */}
            <div className="space-y-2">
              <Label htmlFor="csv-file">Select CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                ref={fileInputRef}
                className="bg-slate-800/50 border-slate-700 text-slate-100"
                data-testid="csv-file-input"
              />
              {selectedFile && (
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <FileText className="h-4 w-4" />
                  <span>{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              )}
            </div>

            {/* Broker Preset Selection */}
            <div className="space-y-2">
              <Label htmlFor="broker-preset">Broker Preset (Optional)</Label>
              <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-100">
                  <SelectValue placeholder="Select your broker for automatic mapping" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                  {BROKER_PRESETS.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name} - {preset.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Import Options */}
            <div className="space-y-4">
              <Label className="text-white font-medium">Import Options</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="skip-duplicates" className="text-slate-300">Skip Duplicates</Label>
                    <p className="text-xs text-slate-500">Prevent importing duplicate trades</p>
                  </div>
                  <Switch
                    id="skip-duplicates"
                    checked={importOptions.skipDuplicates}
                    onCheckedChange={(checked) => 
                      setImportOptions(prev => ({ ...prev, skipDuplicates: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="normalize-timestamps" className="text-slate-300">Normalize Timestamps</Label>
                    <p className="text-xs text-slate-500">Convert all timestamps to UTC</p>
                  </div>
                  <Switch
                    id="normalize-timestamps"
                    checked={importOptions.normalizeTimestamps}
                    onCheckedChange={(checked) => 
                      setImportOptions(prev => ({ ...prev, normalizeTimestamps: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="map-fees" className="text-slate-300">Map Fees & Commissions</Label>
                    <p className="text-xs text-slate-500">Automatically map fee columns</p>
                  </div>
                  <Switch
                    id="map-fees"
                    checked={importOptions.mapFees}
                    onCheckedChange={(checked) => 
                      setImportOptions(prev => ({ ...prev, mapFees: checked }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Error Display */}
            {uploadError && (
              <Alert className="bg-red-900/20 border-red-500/30">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-200">
                  {uploadError}
                </AlertDescription>
              </Alert>
            )}

            {/* Upload Button */}
            <Button
              onClick={handleStartImport}
              disabled={!selectedFile || isUploading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              data-testid="start-import-button"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Start Import
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Status Card */}
      {importRunId && (
        <ImportStatusCard
          importRunId={importRunId}
          onRetry={handleRetry}
          onComplete={handleImportComplete}
        />
      )}

      {/* Features Info */}
      <Card className="bg-blue-900/20 border-blue-500/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-200">
            <Settings className="h-5 w-5" />
            <span>Bulletproof Import Features</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-blue-300">
                <CheckCircle className="h-4 w-4" />
                <span>File size & MIME validation</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-300">
                <CheckCircle className="h-4 w-4" />
                <span>Streaming/chunked parsing</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-300">
                <CheckCircle className="h-4 w-4" />
                <span>Row-level idempotency</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-blue-300">
                <CheckCircle className="h-4 w-4" />
                <span>UTC timestamp normalization</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-300">
                <CheckCircle className="h-4 w-4" />
                <span>Broker preset support</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-300">
                <CheckCircle className="h-4 w-4" />
                <span>Real-time status updates</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

