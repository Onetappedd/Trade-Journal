"use client";
import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/components/auth-provider";

export default function ImportExportTradesPage() {
  if (typeof window === "undefined") return null;
  useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setImportSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/trades/import/preview", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      setUploadError("Failed to parse CSV. Please check your file format.");
      setPreview([]);
      setColumns([]);
      return;
    }
    const data = await res.json();
    setPreview(data.trades || []);
    setColumns(data.columns || []);
  };

  const handleImport = async () => {
    setImportSuccess(null);
    setUploadError(null);
    const res = await fetch("/trades/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ trades: preview }),
    });
    if (!res.ok) {
      setUploadError("Failed to import trades.");
      return;
    }
    setImportSuccess("Trades imported successfully!");
    setPreview([]);
    setColumns([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleExport = async () => {
    setExporting(true);
    const res = await fetch("/trades/export");
    if (!res.ok) {
      setExporting(false);
      return;
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trades.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    setExporting(false);
  };

  return (
    <div className="max-w-3xl w-full mx-auto mt-8 md:mt-16 px-4 md:px-8 py-8 flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Import Trades (Webull/Robinhood CSV)</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="mb-4"
            onChange={handleFileChange}
          />
          {uploadError && <div className="text-red-500 mb-2">{uploadError}</div>}
          {importSuccess && <div className="text-green-600 mb-2">{importSuccess}</div>}
          {preview.length > 0 && (
            <>
              <div className="overflow-x-auto rounded border mb-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((col) => (
                        <TableHead key={col}>{col}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((row, i) => (
                      <TableRow key={i}>
                        {columns.map((col) => (
                          <TableCell key={col}>{row[col]}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button variant="default" size="lg" className="w-full md:w-auto" onClick={handleImport}>
                Import {preview.length} Trades
              </Button>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Export All Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="lg" className="w-full md:w-auto" onClick={handleExport} disabled={exporting}>
            {exporting ? "Exporting..." : "Export as CSV"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
