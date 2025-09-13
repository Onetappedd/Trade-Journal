'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  importRun: {
    id: string;
    source: string;
    summary: {
      added: number;
      duplicates: number;
      errors: number;
    };
    created_at: string;
  };
}

export function DeleteImportModal({
  isOpen,
  onClose,
  onConfirm,
  importRun,
}: DeleteImportModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      toast.success('Import run deleted successfully');
      onClose();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete import run');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalExecutions = importRun.summary.added + importRun.summary.duplicates;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Import Run
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the import run and all associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Deleting this import run will:
            </AlertDescription>
          </Alert>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Executions to delete:</span>
              <span className="font-medium">{totalExecutions}</span>
            </div>
            <div className="flex justify-between">
              <span>Raw import items:</span>
              <span className="font-medium">{importRun.summary.added + importRun.summary.errors}</span>
            </div>
            <div className="flex justify-between">
              <span>Import run:</span>
              <span className="font-medium">1</span>
            </div>
            <div className="flex justify-between">
              <span>Affected trades:</span>
              <span className="font-medium text-amber-600">Will be recomputed</span>
            </div>
          </div>

          <div className="rounded-md bg-muted p-3">
            <div className="text-sm">
              <div className="font-medium mb-1">Import Details:</div>
              <div>Source: {importRun.source}</div>
              <div>Created: {new Date(importRun.created_at).toLocaleString()}</div>
              <div>Added: {importRun.summary.added}</div>
              <div>Duplicates: {importRun.summary.duplicates}</div>
              <div>Errors: {importRun.summary.errors}</div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Import Run'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
