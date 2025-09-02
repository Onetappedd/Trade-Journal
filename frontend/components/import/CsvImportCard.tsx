'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, FileText, Map, Clock, Plus } from 'lucide-react';
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
        const error = await response.json();
        throw new Error(error.error || 'Failed to process file');
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
