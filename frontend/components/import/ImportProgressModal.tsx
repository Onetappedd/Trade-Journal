"use client";

import * as React from "react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type ImportStatus = "idle" | "validating" | "importing" | "done" | "error";

export interface ImportProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: ImportStatus;
  progress?: number; // 0..100
  summary?: { imported: number; skipped: number; failed: number };
  className?: string;
}

export default function ImportProgressModal({
  isOpen,
  onClose,
  status,
  progress = 0,
  summary,
  className,
}: ImportProgressModalProps) {
  // Close only when not actively importing
  const handleOpenChange = (open: boolean) => {
    if (!open && status !== "importing") onClose();
  };
  const getStatusIcon = () => {
    // simple icons for illustration; swap for Lucide or other as needed
    if (status === "importing" || status === "validating") return <span aria-hidden>⏳</span>;
    if (status === "done") return <span aria-hidden>✅</span>;
    if (status === "error") return <span aria-hidden>⚠️</span>;
    return <span aria-hidden>ℹ️</span>;
  };
  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className={cn("sm:max-w-md", className)}>
        <AlertDialogHeader>
          <AlertDialogTitle>Import Trades</AlertDialogTitle>
          <AlertDialogDescription>
            {status === "validating" && "Validating your file..."}
            {status === "importing" && "Import in progress..."}
            {status === "done" && "Import complete."}
            {status === "error" && "Import failed. See details below."}
            {status === "idle" && "Ready to start the import."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex justify-center">{getStatusIcon()}</div>
          {(status === "importing" || status === "validating") && (
            <div className="w-full">
              <div className="h-2 w-full rounded bg-muted">
                <div
                  className="h-2 rounded bg-primary transition-[width]"
                  style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                />
              </div>
              <p className="mt-2 text-center text-sm text-muted-foreground">{progress}%</p>
            </div>
          )}
          {status === "done" && summary && (
            <ul className="grid grid-cols-3 gap-4 text-center">
              <li>
                <div className="text-sm text-muted-foreground">Imported</div>
                <div className="text-lg font-semibold">{summary.imported}</div>
              </li>
              <li>
                <div className="text-sm text-muted-foreground">Skipped</div>
                <div className="text-lg font-semibold">{summary.skipped}</div>
              </li>
              <li>
                <div className="text-sm text-muted-foreground">Failed</div>
                <div className="text-lg font-semibold">{summary.failed}</div>
              </li>
            </ul>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={status === "importing"}>Close</AlertDialogCancel>
          {status === "error" && <AlertDialogAction onClick={onClose}>Try again</AlertDialogAction>}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
