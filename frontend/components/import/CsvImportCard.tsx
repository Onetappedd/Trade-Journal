'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, FileText, Map, Clock, Plus, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { MappingWizard } from './MappingWizard';

interface CsvUpload {
  id: string;
  filename: string;
  uploaded_at: string;
  status: 'pending' | 'mapped' | 'imported' | 'error';
  records_count?: number;
}

interface MappingWizardData {
  sampleRows: any[];
  headers: string[];
  guess: Record<string, string | undefined>;
  uploadToken: string;
}

export function CsvImportCard() {
  const [uploads, setUploads] = useState<CsvUpload[]>([]);
  const [mappingWizardOpen, setMappingWizardOpen] = useState(false);
  const [mappingWizardData, setMappingWizardData] = useState<MappingWizardData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsProcessing(true);
    
    try {
      // Process first file only for now
      const file = acceptedFiles[0];
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/import/csv/init', {
        method: 'POST',
        body: formData,
      });

              if (!response.ok) {
          let errorMessage = 'Failed to process file';
          
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.details || errorMessage;
          } catch (parseError) {
            // If response is not JSON, try to get text
            try {
              const errorText = await response.text();
              if (errorText.includes('timeout') || errorText.includes('timeout')) {
                errorMessage = 'File processing timed out. Please try with a smaller file.';
              } else if (errorText.includes('error')) {
                errorMessage = 'Server error occurred while processing file.';
              } else {
                errorMessage = `Server error (${response.status}): ${errorText.substring(0, 100)}`;
              }
            } catch (textError) {
              errorMessage = `Server error (${response.status}): Unable to read error details`;
            }
          }
          
          throw new Error(errorMessage);
        }

      const result = await response.json();
      
      // Add to uploads list
      const newUpload: CsvUpload = {
        id: result.uploadToken,
        filename: file.name,
        uploaded_at: new Date().toISOString(),
        status: 'pending',
        records_count: result.sampleRows.length,
      };

      setUploads(prev => [newUpload, ...prev].slice(0, 5));
      
      // Store mapping wizard data
      setMappingWizardData({
        sampleRows: result.sampleRows,
        headers: result.headers,
        guess: result.guess,
        uploadToken: result.uploadToken,
      });

      toast.success('File processed successfully', {
        description: `Found ${result.sampleRows.length} sample rows with ${result.headers.length} columns`
      });

      // Open mapping wizard
      setMappingWizardOpen(true);
      
    } catch (error) {
      console.error('File processing error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/tab-separated-values': ['.tsv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/xml': ['.xml'],
    },
    multiple: false,
    disabled: isProcessing,
  });

  const openMappingWizard = (uploadId: string) => {
    const upload = uploads.find(u => u.id === uploadId);
    if (upload && mappingWizardData) {
      setMappingWizardOpen(true);
    } else {
      toast.error('File data not available');
    }
  };

  const handleMappingSuccess = (runId: string, summary: any) => {
    // Update upload status
    setUploads(prev => prev.map(upload => 
      upload.id === mappingWizardData?.uploadToken 
        ? { ...upload, status: 'imported' as const }
        : upload
    ));

    // Clear mapping wizard data
    setMappingWizardData(null);
  };

  const getStatusBadge = (status: CsvUpload['status']) => {
    const variants = {
      pending: 'secondary',
      mapped: 'default',
      imported: 'default',
      error: 'destructive',
    } as const;

    const labels = {
      pending: 'Pending',
      mapped: 'Mapped',
      imported: 'Imported',
      error: 'Error',
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          CSV Import
        </CardTitle>
        <CardDescription>
          Upload CSV files and map columns to import trades
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isProcessing 
              ? 'Processing file...'
              : isDragActive
              ? 'Drop file here...'
              : 'Drag & drop file here, or click to select'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Supports .csv, .tsv, .xls, .xlsx, .xml (IBKR Flex) files
          </p>
          
          {/* Processing Indicator */}
          {isProcessing && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Analyzing file structure...</span>
              </div>
              <div className="text-xs text-muted-foreground">
                This may take a few seconds for large files
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {uploads.some(upload => upload.status === 'error') && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800 mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">File Processing Error</span>
            </div>
            <div className="text-sm text-red-700">
              <p>One or more files failed to process. Common causes:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>File is too large (max 10MB)</li>
                <li>Unsupported file format</li>
                <li>Server timeout - try with a smaller file</li>
                <li>Database connection issues</li>
              </ul>
              <div className="mt-3 space-y-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setUploads([])}
                >
                  Clear Errors & Try Again
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/test-db');
                      const result = await response.json();
                      console.log('Database test result:', result);
                      if (result.success) {
                        toast.success('Database connection test passed', {
                          description: `Total time: ${result.timing.total}ms`
                        });
                      } else {
                        toast.error('Database connection test failed', {
                          description: result.details
                        });
                      }
                    } catch (error) {
                      toast.error('Database test failed', {
                        description: error instanceof Error ? error.message : 'Unknown error'
                      });
                    }
                  }}
                >
                  Test Database Connection
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Uploads */}
        {uploads.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Recent Uploads</h4>
            <div className="space-y-2">
              {uploads.map((upload) => (
                <div
                  key={upload.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{upload.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {new Date(upload.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusBadge(upload.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openMappingWizard(upload.id)}
                      disabled={upload.status === 'imported'}
                    >
                      <Map className="h-3 w-3 mr-1" />
                      Map
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-4 border-t space-y-2">
          <Button variant="outline" className="w-full" disabled={uploads.length === 0}>
            <Map className="h-4 w-4 mr-2" />
            Open Mapping Wizard
          </Button>
          <Link href="/dashboard/import/manual" className="block">
            <Button variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Manual Entry
            </Button>
          </Link>
        </div>
      </CardContent>

      {/* Mapping Wizard */}
      {mappingWizardData && (
        <MappingWizard
          open={mappingWizardOpen}
          onClose={() => setMappingWizardOpen(false)}
          sampleRows={mappingWizardData.sampleRows}
          headers={mappingWizardData.headers}
          guess={mappingWizardData.guess}
          uploadToken={mappingWizardData.uploadToken}
          onSuccess={handleMappingSuccess}
        />
      )}
    </Card>
  );
}
