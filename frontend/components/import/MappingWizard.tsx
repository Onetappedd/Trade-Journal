'use client';

import { useState, useMemo, useEffect } from 'react';
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
  filename?: string;
  onSuccess: (runId: string, summary: any) => void;
}

export function MappingWizard({ 
  open, 
  onClose, 
  sampleRows, 
  headers, 
  guess, 
  uploadToken,
  filename,
  onSuccess 
}: MappingWizardProps) {
  const [mapping, setMapping] = useState<Record<string, string>>(
    Object.fromEntries(
      Object.entries(guess)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, value as string])
    )
  );
  const [selectedBroker, setSelectedBroker] = useState<string>('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [chunkSize, setChunkSize] = useState(1000);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
    status: 'idle' as 'idle' | 'processing' | 'completed' | 'error',
    message: '',
    summary: null as any,
    isValidation: false
  });
  
  // Preset management
  const [presets, setPresets] = useState<any[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('none');
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);
  const [showSavePresetDialog, setShowSavePresetDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetBrokerHint, setNewPresetBrokerHint] = useState('');
  const [newPresetFileGlob, setNewPresetFileGlob] = useState('');
  
  // Resume functionality
  const [resumeInfo, setResumeInfo] = useState<any>(null);
  const [isCheckingResume, setIsCheckingResume] = useState(false);

  // Load presets on component mount
  useEffect(() => {
    loadPresets();
    checkForResumableImports();
  }, []);

  // Auto-detect and apply Webull preset if applicable
  useEffect(() => {
    // Check if this looks like Webull options data
    if (headers.includes('Name') && headers.includes('Filled Time') && headers.includes('Side') && 
        headers.includes('Filled') && headers.includes('Avg Price')) {
      // Auto-apply comprehensive Webull options mapping
      const newMapping: Record<string, string | undefined> = {
        timestamp: 'Filled Time',
        symbol: 'Name', // Will extract underlying from options contract
        side: 'Side',
        quantity: 'Filled',
        price: 'Avg Price',
        fees: headers.includes('Fees') ? 'Fees' : undefined,
        currency: 'USD', // Webull is typically USD
        venue: 'NASDAQ', // Webull options are typically NASDAQ
        order_id: headers.includes('Order ID') ? 'Order ID' : undefined,
        exec_id: headers.includes('Exec ID') ? 'Exec ID' : undefined,
        instrument_type: 'option', // Always options for Webull
        multiplier: '100', // Standard options multiplier
        // Note: expiry, strike, option_type, and underlying will be extracted from the Name column
        // during the actual import process, so we don't map them here to avoid duplicates
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

  // Load presets from API
  const loadPresets = async () => {
    setIsLoadingPresets(true);
    try {
      const params = new URLSearchParams();
      if (filename) params.append('filename', filename);
      
      const response = await fetch(`/api/import/presets?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setPresets(data.presets || []);
        
        // Auto-select best match if available
        if (data.bestMatch && data.bestMatch.matchScore > 0) {
          setSelectedPreset(data.bestMatch.id);
          // Don't auto-apply, just suggest
        }
      }
    } catch (error) {
      console.error('Failed to load presets:', error);
    } finally {
      setIsLoadingPresets(false);
    }
  };

  // Check for resumable imports
  const checkForResumableImports = async () => {
    setIsCheckingResume(true);
    try {
      // Look for any import runs that are in 'processing' status
      const response = await fetch('/api/import/runs?status=processing');
      if (response.ok) {
        const data = await response.json();
        const processingRuns = data.runs || [];
        
        // Check each processing run to see if it can be resumed
        for (const run of processingRuns) {
          const resumeResponse = await fetch(`/api/import/resume?importRunId=${run.id}`);
          if (resumeResponse.ok) {
            const resumeData = await resumeResponse.json();
            if (resumeData.canResume) {
              setResumeInfo(resumeData);
              break; // Found a resumable import
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to check for resumable imports:', error);
    } finally {
      setIsCheckingResume(false);
    }
  };

  // Load a selected preset
  const loadPreset = (presetId: string) => {
    if (presetId === 'none') {
      setSelectedPreset('none');
      return;
    }
    
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setMapping(preset.fields);
      setSelectedPreset(presetId);
      toast.success(`Loaded preset: ${preset.name}`);
    }
  };

  // Save current mapping as a preset
  const savePreset = async () => {
    if (!newPresetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }

    try {
      const response = await fetch('/api/import/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPresetName.trim(),
          broker_hint: newPresetBrokerHint.trim() || undefined,
          file_glob: newPresetFileGlob.trim() || undefined,
          fields: mapping
        })
      });

      if (response.ok) {
        toast.success('Preset saved successfully!');
        setShowSavePresetDialog(false);
        setNewPresetName('');
        setNewPresetBrokerHint('');
        setNewPresetFileGlob('');
        await loadPresets(); // Refresh presets list
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save preset');
      }
    } catch (error) {
      console.error('Failed to save preset:', error);
      toast.error('Failed to save preset');
    }
  };

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

  // Validate only function
  const handleValidate = async () => {
    if (!validation) {
      toast.error('Please fix validation errors before validating');
      return;
    }

    setIsValidating(true);
    setImportProgress({
      current: 0,
      total: sampleRows.length,
      status: 'processing',
      message: 'Validating data...',
      summary: null,
      isValidation: true
    });
    
    try {
      // Step 1: Start the import job with dryRun flag
      setImportProgress(prev => ({ ...prev, message: 'Initializing validation...' }));
      
      const startResponse = await fetch('/api/import/csv/commit-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadToken,
          mapping: {
            ...mapping,
            broker: selectedBroker, // Include broker for adapter selection
          },
          options: {
            currency: 'USD',
            dryRun: true,
            chunkSize,
          },
        }),
      });

      if (!startResponse.ok) {
        const error = await startResponse.json();
        throw new Error(error.error || 'Failed to start validation');
      }

      const startResult = await startResponse.json();
      const { jobId, totalRows } = startResult;
      
      setImportProgress(prev => ({ ...prev, total: totalRows, message: `Validating ${totalRows} rows...` }));
      toast.success(`Validation started: ${totalRows} rows to check`);

      // Step 2: Process all rows for validation
      setImportProgress(prev => ({ ...prev, message: 'Validating all rows...' }));
      
      const chunkResponse = await fetch('/api/import/csv/commit-chunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          offset: 0,
          limit: totalRows,
          dryRun: true,
        }),
      });

      if (!chunkResponse.ok) {
        const error = await chunkResponse.json();
        console.error('Validation chunk error response:', error);
        throw new Error(error.error || error.message || 'Failed to validate rows');
      }

      const chunkResult = await chunkResponse.json();
      
      // Handle validation result
      setImportProgress(prev => ({ 
        ...prev, 
        current: totalRows,
        status: 'completed',
        message: 'Validation completed successfully!',
        summary: { 
          added: chunkResult.added || 0, 
          duplicates: chunkResult.duplicates || 0, 
          errors: chunkResult.errors || 0,
          total: totalRows,
          errorsCsvUrl: chunkResult.errorsCsvUrl,
          errorCount: chunkResult.errorCount
        },
        isValidation: true
      }));
      
      toast.success(`Validation completed: ${chunkResult.added || 0} valid, ${chunkResult.duplicates || 0} duplicates, ${chunkResult.errors || 0} errors`);
      
    } catch (error) {
      console.error('Validation error:', error);
      
      setImportProgress(prev => ({
        ...prev,
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to validate data',
        isValidation: true
      }));
      
      toast.error(error instanceof Error ? error.message : 'Failed to validate data');
    } finally {
      setIsValidating(false);
    }
  };

  // Resume import function
  const handleResume = async () => {
    if (!resumeInfo) {
      toast.error('No resumable import found');
      return;
    }

    setIsCommitting(true);
    setImportProgress({
      current: resumeInfo.lastRowIndex + 1,
      total: resumeInfo.totalRows,
      status: 'processing',
      message: 'Resuming import...',
      summary: null,
      isValidation: false
    });

    try {
      // Resume from the last processed row + 1
      const startResponse = await fetch('/api/import/csv/commit-chunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: uploadToken,
          offset: resumeInfo.lastRowIndex + 1,
          limit: resumeInfo.totalRows - resumeInfo.lastRowIndex - 1,
          startAtRow: resumeInfo.lastRowIndex + 1,
        }),
      });

      if (!startResponse.ok) {
        const error = await startResponse.json();
        throw new Error(error.error || 'Failed to resume import');
      }

      const result = await startResponse.json();
      
      setImportProgress(prev => ({ 
        ...prev, 
        current: resumeInfo.totalRows,
        status: 'completed',
        message: 'Import resumed and completed successfully!',
        summary: { 
          added: result.added || 0, 
          duplicates: result.duplicates || 0, 
          errors: result.errors || 0,
          total: resumeInfo.totalRows,
          errorsCsvUrl: result.errorsCsvUrl,
          errorCount: result.errorCount
        }
      }));
      
      toast.success(`Import resumed and completed: ${result.added || 0} added, ${result.duplicates || 0} duplicates, ${result.errors || 0} errors`);
      
      // Clear resume info since import is now complete
      setResumeInfo(null);
      
      setTimeout(() => {
        onSuccess('resumed', { 
          added: result.added || 0, 
          duplicates: result.duplicates || 0, 
          errors: result.errors || 0,
          total: resumeInfo.totalRows
        });
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Resume error:', error);
      
      setImportProgress(prev => ({
        ...prev,
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to resume import'
      }));
      
      toast.error(error instanceof Error ? error.message : 'Failed to resume import');
    } finally {
      setIsCommitting(false);
    }
  };

  // Simplified commit function based on working implementation
  const handleCommit = async () => {
    if (!validation) {
      toast.error('Please fix validation errors before committing');
      return;
    }

    setIsCommitting(true);
    setImportProgress({
      current: 0,
      total: sampleRows.length,
      status: 'processing',
      message: 'Starting import...',
      summary: null,
      isValidation: false
    });
    
    try {
      // Step 1: Start the import job
      setImportProgress(prev => ({ ...prev, message: 'Initializing import job...' }));
      
      const startResponse = await fetch('/api/import/csv/commit-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadToken,
          mapping: {
            ...mapping,
            broker: selectedBroker, // Include broker for adapter selection
          },
          options: {
            currency: 'USD',
            chunkSize,
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

      // Step 2: Process all rows in one go (simplified approach)
      setImportProgress(prev => ({ ...prev, message: 'Processing all rows...' }));
      
      console.log('Sending mapping to backend:', mapping);
      console.log('Sample row data:', sampleRows[0]);
      
      const chunkResponse = await fetch('/api/import/csv/commit-chunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          offset: 0,
          limit: totalRows, // Process all rows at once
        }),
      });

      if (!chunkResponse.ok) {
        const error = await chunkResponse.json();
        console.error('Commit chunk error response:', error);
        throw new Error(error.error || error.message || 'Failed to process rows');
      }

      const chunkResult = await chunkResponse.json();
      
      // Handle the result
      if (chunkResult.message === 'No more rows to process - import complete') {
        // Import completed successfully
        setImportProgress(prev => ({ 
          ...prev, 
          current: totalRows,
          status: 'completed',
          message: 'Import completed successfully!',
          summary: { 
            added: chunkResult.added || 0, 
            duplicates: chunkResult.duplicates || 0, 
            errors: chunkResult.errors || 0,
            total: totalRows,
            errorsCsvUrl: chunkResult.errorsCsvUrl,
            errorCount: chunkResult.errorCount
          }
        }));
        
        toast.success(`Import completed: ${chunkResult.added || 0} added, ${chunkResult.duplicates || 0} duplicates, ${chunkResult.errors || 0} errors`);
        
        setTimeout(() => {
          onSuccess(startResult.runId, { 
            added: chunkResult.added || 0, 
            duplicates: chunkResult.duplicates || 0, 
            errors: chunkResult.errors || 0,
            total: totalRows
          });
          onClose();
        }, 2000);
      } else {
        // Use the chunk result data
        setImportProgress(prev => ({ 
          ...prev, 
          current: totalRows,
          status: 'completed',
          message: 'Import completed successfully!',
          summary: { 
            added: chunkResult.added || 0, 
            duplicates: chunkResult.duplicates || 0, 
            errors: chunkResult.errors || 0,
            total: totalRows,
            errorsCsvUrl: chunkResult.errorsCsvUrl,
            errorCount: chunkResult.errorCount
          }
        }));
        
        toast.success(`Import completed: ${chunkResult.added || 0} added, ${chunkResult.duplicates || 0} duplicates, ${chunkResult.errors || 0} errors`);
        
        setTimeout(() => {
          onSuccess(startResult.runId, { 
            added: chunkResult.added || 0, 
            duplicates: chunkResult.duplicates || 0, 
            errors: chunkResult.errors || 0,
            total: totalRows
          });
          onClose();
        }, 2000);
      }
      
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
            {/* Mapping Presets */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Mapping Presets</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSavePresetDialog(true)}
                  disabled={Object.keys(mapping).length === 0}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Save Preset
                </Button>
              </div>
              
              {/* Preset Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Select value={selectedPreset} onValueChange={loadPreset}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a preset..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No preset</SelectItem>
                      {presets.map((preset) => (
                        <SelectItem key={preset.id} value={preset.id}>
                          <div className="flex items-center gap-2">
                            <span>{preset.name}</span>
                            {preset.isUserPreset && (
                              <Badge variant="secondary" className="text-xs">Custom</Badge>
                            )}
                            {preset.matchScore > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {preset.matchScore > 50 ? '🎯' : '✨'} Match
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Best Match Suggestion */}
                {presets.find(p => p.id === selectedPreset)?.matchScore > 0 && (
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                    <p className="font-medium">🎯 Suggested preset based on your file!</p>
                    <p>This preset was automatically matched to your upload.</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Broker Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Broker Selection</h3>
              
              <div className="space-y-3">
                <Select value={selectedBroker} onValueChange={setSelectedBroker}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your broker (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific broker</SelectItem>
                    <SelectItem value="webull">Webull</SelectItem>
                    <SelectItem value="ibkr">Interactive Brokers</SelectItem>
                    <SelectItem value="robinhood">Robinhood</SelectItem>
                    <SelectItem value="fidelity">Fidelity</SelectItem>
                    <SelectItem value="schwab">Schwab/TOS</SelectItem>
                    <SelectItem value="etrade">E*TRADE</SelectItem>
                    <SelectItem value="tasty">TastyTrade</SelectItem>
                  </SelectContent>
                </Select>
                
                {selectedBroker && (
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                    <p className="font-medium">✨ Broker-specific optimizations enabled!</p>
                    <p>Advanced parsing will be applied for {BROKER_PRESETS[selectedBroker as keyof typeof BROKER_PRESETS]?.name || selectedBroker} files.</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Broker Presets */}
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
                    <p className="mt-1 text-green-700">• <strong>Options Data:</strong> Expiry, Strike, Type will be parsed from Name column during import</p>
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
                    <span className="font-medium">
                      {importProgress.isValidation ? 'Validating Your Data...' : 'Importing Your Data...'}
                    </span>
                  </div>
                  
                  {/* Progress Details */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-700">{importProgress.message}</span>
                      <span className="font-medium text-blue-800">
                        {importProgress.current.toLocaleString()} / {importProgress.total.toLocaleString()}
                      </span>
                    </div>
                    
                    {/* Indeterminate Progress Bar */}
                    <div className="w-full h-3 bg-blue-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '100%' }} />
                    </div>
                    
                    {/* Progress Message */}
                    <div className="text-center">
                      <span className="text-sm font-medium text-blue-800">
                        {importProgress.isValidation ? 'Validating data...' : 'Processing data...'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Completion Summary */}
            {importProgress.status === 'completed' && importProgress.summary && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">
                    {importProgress.isValidation ? 'Validation Completed!' : 'Import Completed!'}
                  </span>
                </div>
                <div className="text-sm text-green-700 mt-2 space-y-1">
                  <p>• {importProgress.summary.added || 0} {importProgress.isValidation ? 'valid rows' : 'trades imported'}</p>
                  <p>• {importProgress.summary.duplicates || 0} duplicates skipped</p>
                  <p>• {importProgress.summary.errors || 0} errors encountered</p>
                  {importProgress.summary.errorsCsvUrl && (
                    <p className="text-amber-700">• {importProgress.summary.errorCount || importProgress.summary.errors || 0} rows had errors - download CSV to fix and re-import</p>
                  )}
                </div>
                
                {/* Action buttons for completion */}
                <div className="mt-4 flex gap-2">
                  {!importProgress.isValidation && importProgress.summary.added > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Generate date range for filtering (last 30 days as default)
                        const endDate = new Date().toISOString().split('T')[0];
                        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                        const filterUrl = `/dashboard/trades?startDate=${startDate}&endDate=${endDate}`;
                        window.open(filterUrl, '_blank');
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Imported Trades
                    </Button>
                  )}
                  {!importProgress.isValidation && importProgress.summary.errorsCsvUrl && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        window.open(importProgress.summary.errorsCsvUrl, '_blank');
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Download errors.csv ({importProgress.summary.errorCount || importProgress.summary.errors || 0} rows)
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setImportProgress(prev => ({ ...prev, status: 'idle', message: '', summary: null }));
                    }}
                  >
                    {importProgress.isValidation ? 'Validate Again' : 'Import More'}
                  </Button>
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

            {/* Resume Import Alert */}
            {resumeInfo && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-amber-800 mb-3">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Resumable Import Found! 🔄</span>
                </div>
                <div className="text-sm text-amber-700 space-y-2">
                  <p>• Previous import was interrupted at row {resumeInfo.lastRowIndex + 1}</p>
                  <p>• {resumeInfo.progressPercentage}% of file was processed</p>
                  <p>• You can resume from where you left off</p>
                </div>
                <div className="mt-3">
                  <Button 
                    onClick={handleResume}
                    disabled={isCommitting}
                    variant="outline"
                    className="w-full"
                  >
                    {isCommitting ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Resuming...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Resume Import from Row {resumeInfo.lastRowIndex + 1}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Import Controls */}
            <div className="space-y-4 pt-4">
              {/* Chunk Size Select */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Chunk Size:</label>
                <Select value={chunkSize.toString()} onValueChange={(value) => setChunkSize(Number(value))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="500">500</SelectItem>
                    <SelectItem value="1000">1000</SelectItem>
                    <SelectItem value="2500">2500</SelectItem>
                    <SelectItem value="5000">5000</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs text-gray-500">rows per batch</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleValidate} 
                  disabled={!validation || isValidating}
                  variant="secondary"
                  className="flex-1"
                >
                  {isValidating ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Validate Only
                    </>
                  )}
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
                    <p className="text-xs text-green-700">Core fields mapped, options data will be parsed from Name column</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Save Preset Dialog */}
        {showSavePresetDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
              <h3 className="text-lg font-semibold mb-4">Save Mapping Preset</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preset Name *
                  </label>
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="e.g., My Robinhood Setup"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Broker Hint (optional)
                  </label>
                  <input
                    type="text"
                    value={newPresetBrokerHint}
                    onChange={(e) => setNewPresetBrokerHint(e.target.value)}
                    placeholder="e.g., robinhood, fidelity, webull"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File Pattern (optional)
                  </label>
                  <input
                    type="text"
                    value={newPresetFileGlob}
                    onChange={(e) => setNewPresetFileGlob(e.target.value)}
                    placeholder="e.g., *.csv, *options*.csv"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use * for wildcards. This helps auto-suggest presets for similar files.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowSavePresetDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={savePreset}
                  disabled={!newPresetName.trim()}
                  className="flex-1"
                >
                  Save Preset
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
