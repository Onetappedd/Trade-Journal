'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ImportRun, ImportSource, ImportStatus } from '@/lib/types/imports';
import { formatDistanceToNow } from 'date-fns';
import { X, AlertCircle, CheckCircle, Clock, FileText, Mail, Zap, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface ImportResultModalProps {
  importRun: ImportRun;
  onClose: () => void;
}

const SOURCES: Record<ImportSource, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  csv: { label: 'CSV Import', icon: FileText },
  email: { label: 'Email', icon: Mail },
  manual: { label: 'Manual', icon: Zap },
  api: { label: 'API', icon: Zap },
};

const STATUSES: Record<ImportStatus, { label: string; variant: 'default' | 'secondary' | 'destructive'; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: 'Pending', variant: 'secondary', icon: Clock },
  processing: { label: 'Processing', variant: 'secondary', icon: Clock },
  partial: { label: 'Partial Success', variant: 'default', icon: AlertCircle },
  success: { label: 'Success', variant: 'default', icon: CheckCircle },
  failed: { label: 'Failed', variant: 'destructive', icon: AlertCircle },
};

export function ImportResultModal({ importRun, onClose }: ImportResultModalProps) {
  const router = useRouter();
  
  const fetchImportRunDetails = async (): Promise<ImportRun> => {
    try {
      const response = await fetch(`/api/import/runs/${importRun.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch import run details');
      }
      return response.json();
    } catch (error) {
      toast.error('Failed to load import details', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      throw error;
    }
  };

  const { data: runDetails, isLoading } = useQuery({
    queryKey: ['import-run-details', importRun.id],
    queryFn: fetchImportRunDetails,
    initialData: importRun,
  });

  const sourceConfig = SOURCES[runDetails.source];
  const statusConfig = STATUSES[runDetails.status];
  const SourceIcon = sourceConfig.icon;
  const StatusIcon = statusConfig.icon;

  const summary = runDetails.summary || {};
  const duration = runDetails.started_at && runDetails.finished_at
    ? new Date(runDetails.finished_at).getTime() - new Date(runDetails.started_at).getTime()
    : null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SourceIcon className="h-5 w-5" />
            Import Run Details
          </DialogTitle>
          <DialogDescription>
            Detailed results for {sourceConfig.label} import
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Source</p>
              <p className="flex items-center gap-2">
                <SourceIcon className="h-4 w-4" />
                {sourceConfig.label}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <div className="flex items-center gap-2">
                <StatusIcon className="h-4 w-4" />
                <Badge variant={statusConfig.variant}>
                  {statusConfig.label}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Started</p>
              <p>
                {runDetails.started_at ? (
                  <>
                    {new Date(runDetails.started_at).toLocaleString()}
                    <br />
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(runDetails.started_at), { addSuffix: true })}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Finished</p>
              <p>
                {runDetails.finished_at ? (
                  <>
                    {new Date(runDetails.finished_at).toLocaleString()}
                    <br />
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(runDetails.finished_at), { addSuffix: true })}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </p>
            </div>
          </div>

          {duration && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Duration</p>
              <p>{Math.round(duration / 1000)} seconds</p>
            </div>
          )}

          <Separator />

          {/* Summary Stats */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {summary.added || 0}
                </p>
                <p className="text-sm text-muted-foreground">Trades Added</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">
                  {summary.duplicates || 0}
                </p>
                <p className="text-sm text-muted-foreground">Duplicates</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-red-600">
                  {summary.errors || 0}
                </p>
                <p className="text-sm text-muted-foreground">Errors</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {summary.total || 0}
                </p>
                <p className="text-sm text-muted-foreground">Total Processed</p>
              </div>
            </div>
          </div>

          {/* Error Details */}
          {runDetails.error && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4 text-red-600">Error Details</h3>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <pre className="text-sm text-red-800 whitespace-pre-wrap">
                    {runDetails.error}
                  </pre>
                </div>
              </div>
            </>
          )}

          {/* Additional Summary Data */}
          {summary.details && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Additional Details</h3>
                <div className="p-4 bg-muted rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(summary.details, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => {
              onClose();
              router.push(`/dashboard/import/runs/${importRun.id}`);
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
