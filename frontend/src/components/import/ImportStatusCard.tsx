'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw, 
  AlertTriangle,
  FileText,
  Database,
  Zap
} from 'lucide-react';

interface ImportStatus {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalRows: number;
  processedRows: number;
  errors: string[];
  result?: {
    inserted: number;
    skipped: number;
    errors: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface ImportStatusCardProps {
  importRunId: string;
  onRetry?: () => void;
  onComplete?: () => void;
}

export function ImportStatusCard({ importRunId, onRetry, onComplete }: ImportStatusCardProps) {
  const [status, setStatus] = useState<ImportStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const { supabase } = await import('@/lib/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('No session found');
        return;
      }

      const response = await fetch(`/api/import/csv?id=${importRunId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch status: ${response.statusText}`);
      }

      const data = await response.json();
      setStatus(data);
      setError(null);

      // Call onComplete if status is completed
      if (data.status === 'completed' && onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error('Error fetching status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!importRunId) return;

    // Initial fetch
    fetchStatus();

    // Poll for updates every 2 seconds
    const interval = setInterval(fetchStatus, 2000);

    return () => clearInterval(interval);
  }, [importRunId]);

  const getStatusIcon = () => {
    if (!status) return <Clock className="h-5 w-5" />;
    
    switch (status.status) {
      case 'queued':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'processing':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusColor = () => {
    if (!status) return 'bg-gray-500';
    
    switch (status.status) {
      case 'queued':
        return 'bg-yellow-500';
      case 'processing':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    if (!status) return 'Loading...';
    
    switch (status.status) {
      case 'queued':
        return 'Queued for processing';
      case 'processing':
        return `Processing... ${status.processedRows}/${status.totalRows} rows`;
      case 'completed':
        return 'Import completed successfully';
      case 'failed':
        return 'Import failed';
      default:
        return 'Unknown status';
    }
  };

  if (isLoading && !status) {
    return (
      <Card className="bg-slate-900/50 border-slate-800/50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
            <span className="text-slate-300">Loading import status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-500/30">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <XCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-red-200 font-medium">Error loading status</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card className="bg-slate-900/50 border-slate-800/50">
        <CardContent className="p-6">
          <p className="text-slate-300">No status information available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800/50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-3 text-white">
          {getStatusIcon()}
          <span>Import Status</span>
          <Badge className={`${getStatusColor()} text-white`}>
            {status.status.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Text */}
        <div className="flex items-center space-x-2">
          <span className="text-slate-300">{getStatusText()}</span>
        </div>

        {/* Progress Bar */}
        {status.status === 'processing' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Progress</span>
              <span>{status.progress}%</span>
            </div>
            <Progress value={status.progress} className="h-2" />
          </div>
        )}

        {/* Statistics */}
        {status.result && (
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 text-green-400">
                <Database className="h-4 w-4" />
                <span className="font-medium">{status.result.inserted}</span>
              </div>
              <p className="text-slate-400 text-xs">Inserted</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 text-yellow-400">
                <FileText className="h-4 w-4" />
                <span className="font-medium">{status.result.skipped}</span>
              </div>
              <p className="text-slate-400 text-xs">Skipped</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 text-red-400">
                <XCircle className="h-4 w-4" />
                <span className="font-medium">{status.result.errors}</span>
              </div>
              <p className="text-slate-400 text-xs">Errors</p>
            </div>
          </div>
        )}

        {/* Errors */}
        {status.errors && status.errors.length > 0 && (
          <Alert className="bg-red-900/20 border-red-500/30">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="text-red-200 font-medium">Errors encountered:</p>
                <div className="max-h-32 overflow-y-auto">
                  {status.errors.slice(0, 5).map((error, index) => (
                    <p key={index} className="text-red-300 text-sm">{error}</p>
                  ))}
                  {status.errors.length > 5 && (
                    <p className="text-red-300 text-sm">... and {status.errors.length - 5} more errors</p>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          {status.status === 'failed' && onRetry && (
            <Button 
              onClick={onRetry}
              variant="outline"
              className="bg-red-900/20 border-red-500/30 text-red-200 hover:bg-red-800/30"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Import
            </Button>
          )}
          
          {status.status === 'completed' && (
            <Button 
              onClick={() => window.location.reload()}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Zap className="h-4 w-4 mr-2" />
              View Results
            </Button>
          )}
        </div>

        {/* Timestamps */}
        <div className="text-xs text-slate-500 space-y-1">
          <p>Started: {new Date(status.createdAt).toLocaleString()}</p>
          <p>Updated: {new Date(status.updatedAt).toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}
