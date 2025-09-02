'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Map, CheckCircle, AlertCircle, Clock, FileText, Mail, Zap } from 'lucide-react';

// Canonical fields
const CANONICAL_FIELDS = [
  { key: 'timestamp', label: 'Timestamp', required: true, description: 'Trade execution time' },
  { key: 'symbol', label: 'Symbol', required: true, description: 'Stock/option symbol' },
  { key: 'side', label: 'Side', required: true, description: 'Buy/Sell/Short' },
  { key: 'quantity', label: 'Quantity', required: true, description: 'Number of shares/contracts' },
  { key: 'price', label: 'Price', required: true, description: 'Execution price' },
  { key: 'fees', label: 'Fees', required: false, description: 'Commission and fees' },
  { key: 'currency', label: 'Currency', required: false, description: 'Trade currency' },
  { key: 'venue', label: 'Venue', required: false, description: 'Exchange/market' },
  { key: 'order_id', label: 'Order ID', required: false, description: 'Broker order identifier' },
  { key: 'exec_id', label: 'Execution ID', required: false, description: 'Execution identifier' },
  { key: 'instrument_type', label: 'Instrument Type', required: false, description: 'Stock/option/future' },
  { key: 'expiry', label: 'Expiry', required: false, description: 'Option expiration date' },
  { key: 'strike', label: 'Strike', required: false, description: 'Option strike price' },
  { key: 'option_type', label: 'Option Type', required: false, description: 'Call/Put' },
  { key: 'multiplier', label: 'Multiplier', required: false, description: 'Contract multiplier' },
  { key: 'underlying', label: 'Underlying', required: false, description: 'Underlying symbol' },
];

// Broker presets
const BROKER_PRESETS = {
  robinhood: {
    name: 'Robinhood',
    mapping: {
      timestamp: 'Time',
      symbol: 'Symbol',
      side: 'Side',
      quantity: 'Quantity',
      price: 'Price',
      fees: 'Fees',
    },
  },
  ibkr: {
    name: 'Interactive Brokers (Flex)',
    mapping: {
      timestamp: 'dateTime',
      symbol: 'symbol',
      side: 'side',
      quantity: 'quantity',
      price: 'price',
      fees: 'fees',
      currency: 'currency',
      venue: 'exchange',
      order_id: 'orderID',
      exec_id: 'execID',
      instrument_type: 'instrumentType',
      expiry: 'expiry',
      strike: 'strike',
      option_type: 'optionType',
      multiplier: 'multiplier',
      underlying: 'underlying',
    },
  },
  fidelity: {
    name: 'Fidelity',
    mapping: {
      timestamp: 'Date/Time',
      symbol: 'Symbol',
      side: 'Action',
      quantity: 'Quantity',
      price: 'Price',
      fees: 'Commission',
    },
  },
  schwab: {
    name: 'Schwab/TOS',
    mapping: {
      timestamp: 'Date/Time',
      symbol: 'Symbol',
      side: 'Action',
      quantity: 'Quantity',
      price: 'Price',
      fees: 'Commission',
    },
  },
  webull: {
    name: 'Webull Options',
    mapping: {
      timestamp: 'Filled Time',
      symbol: 'Name',
      side: 'Side',
      quantity: 'Filled',
      price: 'Avg Price',
      fees: 'Fees',
      instrument_type: 'instrument_type', // Will be auto-detected as 'option'
      expiry: 'expiry', // Will be extracted from Name column
      strike: 'strike', // Will be extracted from Name column
      option_type: 'option_type', // Will be extracted from Name column
      underlying: 'underlying', // Will be extracted from Name column
    },
  },
  etrade: {
    name: 'E*TRADE',
    mapping: {
      timestamp: 'Date/Time',
      symbol: 'Symbol',
      side: 'Action',
      quantity: 'Quantity',
      price: 'Price',
      fees: 'Commission',
    },
  },
  tasty: {
    name: 'TastyTrade',
    mapping: {
      timestamp: 'Date/Time',
      symbol: 'Symbol',
      side: 'Action',
      quantity: 'Quantity',
      price: 'Price',
      fees: 'Commission',
    },
  },
  test: {
    name: 'Test Matching Engine',
    mapping: {
      timestamp: 'Time',
      symbol: 'Symbol',
      side: 'Side',
      quantity: 'Quantity',
      price: 'Price',
      fees: 'Fees',
      currency: 'Currency',
      venue: 'Venue',
      order_id: 'OrderID',
      exec_id: 'ExecID',
      instrument_type: 'InstrumentType',
      expiry: 'Expiry',
      strike: 'Strike',
      option_type: 'OptionType',
      multiplier: 'Multiplier',
      underlying: 'Underlying',
    },
  },
};

interface MappingWizardProps {
  open: boolean;
  onClose: () => void;
  sampleRows: any[];
  headers: string[];
  guess: Record<string, string | undefined>;
  uploadToken: string;
  onSuccess: (runId: string, summary: any) => void;
}

export function MappingWizard({ 
  open, 
  onClose, 
  sampleRows, 
  headers, 
  guess, 
  uploadToken,
  onSuccess 
}: MappingWizardProps) {
  const [mapping, setMapping] = useState<Record<string, string>>(
    Object.fromEntries(
      Object.entries(guess)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, value as string])
    )
  );
  const [isCommitting, setIsCommitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
    status: 'idle' as 'idle' | 'processing' | 'completed' | 'error',
    message: '',
    summary: null as any
  });

  // Auto-detect and apply Webull preset if applicable
  useMemo(() => {
    // Check if this looks like Webull options data
    if (headers.includes('Name') && headers.includes('Filled Time') && headers.includes('Side') && 
        headers.includes('Filled') && headers.includes('Avg Price')) {
      // Auto-apply comprehensive Webull options mapping
      const newMapping: Record<string, string | undefined> = {
        timestamp: 'Filled Time',
        symbol: 'Name',
        side: 'Side',
        quantity: 'Filled',
        price: 'Avg Price',
        fees: headers.includes('Fees') ? 'Fees' : undefined,
        currency: 'USD', // Webull is typically USD
        venue: 'NASDAQ', // Webull options are typically NASDAQ
        order_id: headers.includes('Order ID') ? 'Order ID' : undefined,
        exec_id: headers.includes('Exec ID') ? 'Exec ID' : undefined,
        instrument_type: 'option', // Always options for Webull
        expiry: 'Name', // Will be extracted from Name column
        strike: 'Name', // Will be extracted from Name column
        option_type: 'Name', // Will be extracted from Name column
        multiplier: '100', // Standard options multiplier
        underlying: 'Name', // Will be extracted from Name column
      };
      
      // Filter out undefined values and convert to Record<string, string>
      const filteredMapping: Record<string, string> = Object.fromEntries(
        Object.entries(newMapping).filter(([_, value]) => value !== undefined) as [string, string][]
      );
      
      // Set the mapping
      setMapping(filteredMapping);
      console.log('Auto-applied comprehensive Webull options preset');
    }
  }, [headers]);

  // Validate mapping
  const validation = useMemo(() => {
    const errors: string[] = [];
    const requiredFields = CANONICAL_FIELDS.filter(f => f.required);
    
    for (const field of requiredFields) {
      if (!mapping[field.key]) {
        errors.push(`Missing required field: ${field.label}`);
      }
    }

    // Check for duplicate mappings
    const mappedHeaders = Object.values(mapping).filter(Boolean);
    const uniqueHeaders = new Set(mappedHeaders);
    if (mappedHeaders.length !== uniqueHeaders.size) {
      errors.push('Duplicate header mappings detected');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }, [mapping]);

  // Apply preset
  const applyPreset = (presetKey: string) => {
    const preset = BROKER_PRESETS[presetKey as keyof typeof BROKER_PRESETS];
    if (preset) {
      const newMapping: Record<string, string> = {};
      
      // Only apply mappings for headers that exist
      for (const [canonicalField, headerName] of Object.entries(preset.mapping)) {
        if (headers.includes(headerName)) {
          newMapping[canonicalField] = headerName;
        }
      }
      
      setMapping(newMapping);
      toast.success(`Applied ${preset.name} preset`);
    }
  };

  // Generate preview data
  const previewData = useMemo(() => {
    return sampleRows.slice(0, 20).map((row, index) => {
      const preview: any = { row: index + 1 };
      
      for (const [canonicalField, headerName] of Object.entries(mapping)) {
        if (headerName && row[headerName] !== undefined) {
          preview[canonicalField] = row[headerName];
        }
      }
      
      return preview;
    });
  }, [sampleRows, mapping]);

  // Commit mapping with chunked processing
  const handleCommit = async () => {
    if (!validation) {
      toast.error('Please fix validation errors before committing');
      return;
    }

    setIsCommitting(true);
    setImportProgress({
      current: 0,
      total: 0,
      status: 'processing',
      message: 'Starting import...',
      summary: null
    });
    
    try {
      // Step 1: Start the import job
      setImportProgress(prev => ({ ...prev, message: 'Initializing import job...' }));
      
      const startResponse = await fetch('/api/import/csv/commit-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadToken,
          mapping,
          options: {
            currency: 'USD',
          },
        }),
      });

      if (!startResponse.ok) {
        const error = await startResponse.json();
        throw new Error(error.error || 'Failed to start import job');
      }

      const startResult = await startResponse.json();
      const { jobId, totalRows } = startResult;
      
      setImportProgress(prev => ({ ...prev, total: totalRows, message: `Processing ${totalRows} rows...` }));
      toast.success(`Import started: ${totalRows} rows to process`);

      // Step 2: Process chunks with progress tracking
      const chunkSize = 2000; // Process 2000 rows per chunk
      let processedRows = 0;
      let totalAdded = 0;
      let totalDuplicates = 0;
      let totalErrors = 0;

      while (processedRows < totalRows) {
        // Update progress
        setImportProgress(prev => ({ 
          ...prev, 
          current: processedRows,
          message: `Processing rows ${processedRows + 1} to ${Math.min(processedRows + chunkSize, totalRows)} of ${totalRows}... (${Math.round((processedRows / totalRows) * 100)}% complete)`
        }));

        // Process chunk
        const chunkResponse = await fetch('/api/import/csv/commit-chunk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId,
            offset: processedRows,
            limit: chunkSize,
          }),
        });

        if (!chunkResponse.ok) {
          const error = await chunkResponse.json();
          throw new Error(error.error || 'Failed to process chunk');
        }

        const chunkResult = await chunkResponse.json();
        processedRows = chunkResult.processedRows;
        totalAdded += chunkResult.added || 0;
        totalDuplicates += chunkResult.duplicates || 0;
        totalErrors += chunkResult.errors || 0;

        // Check progress
        const progressResponse = await fetch(`/api/import/csv/progress?jobId=${jobId}`);
        if (progressResponse.ok) {
          const progress = await progressResponse.json();
          
          if (progress.status === 'completed') {
            // Import is complete
            setImportProgress(prev => ({ 
              ...prev, 
              current: totalRows,
              status: 'completed',
              message: 'Import completed successfully!',
              summary: progress.summary
            }));
            
            toast.success(`Import completed: ${progress.summary.added} added, ${progress.summary.duplicates} duplicates, ${progress.summary.errors} errors`);
            
            // Wait a moment to show completion, then close
            setTimeout(() => {
              onSuccess(startResult.runId, progress.summary);
              onClose();
            }, 2000);
            
            return;
          }
        }

        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Final progress check
      const finalProgressResponse = await fetch(`/api/import/csv/progress?jobId=${jobId}`);
      if (finalProgressResponse.ok) {
        const finalProgress = await finalProgressResponse.json();
        setImportProgress(prev => ({ 
          ...prev, 
          current: totalRows,
          status: 'completed',
          message: 'Import completed successfully!',
          summary: finalProgress.summary
        }));
        
        toast.success(`Import completed: ${finalProgress.summary.added} added, ${finalProgress.summary.duplicates} duplicates, ${finalProgress.summary.errors} errors`);
        
        setTimeout(() => {
          onSuccess(startResult.runId, finalProgress.summary);
          onClose();
        }, 2000);
      } else {
        setImportProgress(prev => ({ 
          ...prev, 
          current: totalRows,
          status: 'completed',
          message: 'Import completed successfully!',
          summary: { added: totalAdded, duplicates: totalDuplicates, errors: totalErrors, total: totalRows }
        }));
        
        toast.success(`Import completed: ${totalAdded} added, ${totalDuplicates} duplicates, ${totalErrors} errors`);
        
        setTimeout(() => {
          onSuccess(startResult.runId, { added: totalAdded, duplicates: totalDuplicates, errors: totalErrors, total: totalRows });
          onClose();
        }, 2000);
      }
      
      onClose();
      
    } catch (error) {
      console.error('Commit error:', error);
      
      // Set error status for display
      setImportProgress(prev => ({
        ...prev,
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to commit import'
      }));
      
      toast.error(error instanceof Error ? error.message : 'Failed to commit import');
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            CSV Mapping Wizard
          </DialogTitle>
          <DialogDescription>
            Map your CSV columns to our standard fields and preview the results
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Mapping */}
          <div className="space-y-6">
            {/* Presets */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Broker Presets</h3>
              
                             {/* Auto-detection indicator */}
               {headers.includes('Name') && headers.includes('Filled Time') && headers.includes('Side') && 
                headers.includes('Filled') && headers.includes('Avg Price') && (
                 <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                   <div className="flex items-center gap-2 text-green-800">
                     <CheckCircle className="h-4 w-4" />
                     <span className="text-sm font-medium">Webull Options format fully auto-configured! 🎯</span>
                   </div>
                   <p className="text-xs text-green-700 mt-1">All fields have been automatically mapped - no user input required!</p>
                   <div className="mt-2 p-2 bg-green-100 rounded text-xs text-green-800">
                     <p className="font-medium">Auto-configured Fields:</p>
                     <p>• <strong>Timestamp:</strong> Filled Time</p>
                     <p>• <strong>Symbol:</strong> Name (will extract underlying from options contract)</p>
                     <p>• <strong>Side:</strong> Side (Buy/Sell)</p>
                     <p>• <strong>Quantity:</strong> Filled</p>
                     <p>• <strong>Price:</strong> Avg Price</p>
                     <p>• <strong>Instrument Type:</strong> Option (auto-set)</p>
                     <p>• <strong>Multiplier:</strong> 100 (standard options)</p>
                     <p className="mt-2 font-medium text-green-900">✅ Ready to import - click "Import Data" below!</p>
                   </div>
                 </div>
               )}
              
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(BROKER_PRESETS).map(([key, preset]) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(key)}
                    className="justify-start"
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Field Mapping */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Field Mapping</h3>
              <div className="space-y-3">
                {CANONICAL_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{field.description}</p>
                    <Select
                      value={mapping[field.key] || ''}
                                            onValueChange={(value) => {
                        if (value && value !== 'none') {
                          setMapping(prev => ({ ...prev, [field.key]: value }));
                        } else {
                          setMapping(prev => {
                            const newMapping = { ...prev };
                            delete newMapping[field.key];
                            return newMapping;
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column...">
                          {mapping[field.key] || ''}
                        </SelectValue>
                      </SelectTrigger>
                                             <SelectContent 
                         className="!bg-white !border-gray-200 !shadow-lg" 
                         style={{ backgroundColor: 'white', '--tw-bg-opacity': '1' } as React.CSSProperties}
                       >
                         <SelectItem value="none" className="!bg-white hover:!bg-gray-100 focus:!bg-gray-100">(none)</SelectItem>
                         {headers.filter(header => header && header.trim() !== '').map((header) => (
                           <SelectItem key={header} value={header} className="!bg-white hover:!bg-gray-100 focus:!bg-gray-100">
                             {header}
                           </SelectItem>
                         ))}
                       </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {/* Validation */}
            {validationErrors.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Progress Bar */}
            {importProgress.status === 'processing' && (
              <div className="space-y-4 pt-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-800 mb-3">
                    <Clock className="h-5 w-5 animate-spin" />
                    <span className="font-medium">Importing Your Data...</span>
                  </div>
                  
                  {/* Progress Details */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-700">{importProgress.message}</span>
                      <span className="font-medium text-blue-800">
                        {importProgress.current.toLocaleString()} / {importProgress.total.toLocaleString()}
                      </span>
                    </div>
                    
                    {/* Main Progress Bar */}
                    <Progress 
                      value={importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0} 
                      className="w-full h-3"
                    />
                    
                    {/* Progress Percentage */}
                    <div className="text-center">
                      <span className="text-sm font-medium text-blue-800">
                        {importProgress.total > 0 ? Math.round((importProgress.current / importProgress.total) * 100) : 0}% Complete
                      </span>
                    </div>
                    
                    {/* Estimated Time */}
                    {importProgress.current > 0 && (
                      <div className="text-xs text-blue-600 text-center">
                        Processing approximately {Math.ceil((importProgress.total - importProgress.current) / 2000)} more chunks...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Completion Summary */}
            {importProgress.status === 'completed' && importProgress.summary && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Import Completed!</span>
                </div>
                <div className="text-sm text-green-700 mt-2 space-y-1">
                  <p>• {importProgress.summary.added || 0} trades imported</p>
                  <p>• {importProgress.summary.duplicates || 0} duplicates skipped</p>
                  <p>• {importProgress.summary.errors || 0} errors encountered</p>
                </div>
              </div>
            )}

            {/* Error Display */}
            {importProgress.status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Import Failed</span>
                </div>
                <div className="text-sm text-red-700 mt-2 space-y-2">
                  <p className="font-medium">Error Details:</p>
                  <div className="bg-red-100 p-3 rounded border border-red-200">
                    <p className="font-mono text-xs break-words">
                      {importProgress.message}
                    </p>
                  </div>
                  <div className="pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setImportProgress(prev => ({ ...prev, status: 'idle', message: '', summary: null }));
                      }}
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleCommit} 
                disabled={!validation || isCommitting}
                className="flex-1"
              >
                {isCommitting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Import Data
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="space-y-4">
                         <div>
               <h3 className="text-lg font-semibold mb-3">Preview (First 20 Rows)</h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Row</TableHead>
                      {CANONICAL_FIELDS.filter(field => mapping[field.key]).map((field) => (
                        <TableHead key={field.key} className="text-xs">
                          {field.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-xs">{row.row}</TableCell>
                        {CANONICAL_FIELDS.filter(field => mapping[field.key]).map((field) => (
                          <TableCell key={field.key} className="text-xs max-w-24 truncate">
                            {row[field.key] !== undefined ? String(row[field.key]) : '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

                         {/* Summary */}
             <div className="bg-muted p-4 rounded-lg">
               <h4 className="font-medium mb-2">Import Summary</h4>
               <div className="text-sm space-y-1">
                 <p>• {sampleRows.length} total rows detected</p>
                 <p>• {Object.keys(mapping).filter(k => mapping[k]).length} fields mapped</p>
                 <p>• {CANONICAL_FIELDS.filter(f => f.required && mapping[f.key]).length}/{CANONICAL_FIELDS.filter(f => f.required).length} required fields</p>
                 {headers.includes('Name') && headers.includes('Filled Time') && headers.includes('Side') && 
                  headers.includes('Filled') && headers.includes('Avg Price') && (
                   <div className="mt-3 p-2 bg-green-100 rounded border border-green-200">
                     <p className="text-xs text-green-800 font-medium">🎯 Webull Options Import</p>
                     <p className="text-xs text-green-700">All fields auto-configured for options trading</p>
                   </div>
                 )}
               </div>
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
