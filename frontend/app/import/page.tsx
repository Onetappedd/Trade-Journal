// frontend/app/import/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/context/auth-provider";

const brokerInstructions: Record<string, { label: string; instructions: string }> = {
  webull: {
    label: "Webull",
    instructions: `
1. Log in to your Webull account on the web platform.
2. Go to 'Account' > 'Trade History' or 'Reports'.
3. Click 'Export' or 'Download' to get your trade history as a CSV file.
4. Save the file to your computer, then upload it below.`
  },
  robinhood: {
    label: "Robinhood",
    instructions: `
1. Log in to Robinhood on the web (not the mobile app).
2. Go to 'Account' > 'History' or 'Statements & History'.
3. Click 'Download' or 'Export' to get your trade history as a CSV file.
4. Save the file to your computer, then upload it below.`
  }
};

export default function ImportPage() {
  const { user } = useAuth();
  if (!user) return <p>Please log in to import trades.</p>;

  const [broker, setBroker] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importSummary, setImportSummary] = useState<null | {
    imported: number;
    skipped: number;
    errors: [number, string][];
  }>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [preview, setPreview] = useState<any[] | null>(null);
  const [previewErrors, setPreviewErrors] = useState<[number, string][]>([]);
  const [tradeType, setTradeType] = useState<string>("stock");
  const { refreshTrades } = useAuth(); // or your trade-data hook

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(null);
      setPreviewErrors([]);
      setImportSummary(null);
      setErrorMsg("");

      const formData = new FormData();
      formData.append("file", selected);
      formData.append("broker", broker);
      formData.append("trade_type", tradeType);

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        const res = await fetch(
          `${apiUrl}/api/import-trades?preview=true`,
          {
            method: "POST",
            body: formData,
            signal: controller.signal,
          }
        );
        clearTimeout(timeout);

        if (!res.ok) {
          let msg = "Failed to preview file.";
          try {
            const data = await res.json();
            msg = data?.detail || msg;
          } catch {}
          setPreview(null);
          setPreviewErrors([[0, msg]]);
          return;
        }

        const data = await res.json();
        setPreview(data.preview || []);
        setPreviewErrors(data.errors || []);
      } catch (e: any) {
        setPreview(null);
        setPreviewErrors([
          [
            0,
            e.name === "AbortError"
              ? "Request timed out. Please try again or use a smaller file."
              : e.message || "Failed to preview file",
          ],
        ]);
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      setErrorMsg("Please select a CSV file to import.");
      return;
    }
    if (!broker) {
      setErrorMsg("Please select a broker.");
      return;
    }

    setUploading(true);
    setImportSummary(null);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("broker", broker);
    formData.append("trade_type", tradeType);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(`${apiUrl}/api/import-trades`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await res.json();
      if (!res.ok || !data.success) {
        const msg = data.errors?.length
          ? data.errors.map((e: [number, string]) => `Row ${e[0]}: ${e[1]}`).join("\n")
          : data.detail || data.message || "Import failed. Please check your file.";
        setErrorMsg(msg);
      } else {
        setImportSummary({
          imported: data.count,
          skipped: data.skipped,
          errors: data.errors || [],
        });
        setErrorMsg("");
        refreshTrades();
      }
    } catch (err: any) {
      setErrorMsg(
        err.name === "AbortError"
          ? "Request timed out. Try again or use a smaller file."
          : err.message || "Import failed. Please check your file."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 w-full bg-background text-foreground flex flex-col items-center justify-center px-4 py-12">
        <Card className="w-full max-w-xl shadow-lg border border-border">
          <CardContent className="py-10 flex flex-col gap-8">
            <h1 className="text-3xl font-bold text-center">Import Trade History</h1>

            <div className="space-y-4">
              <label className="font-semibold text-lg">Select Broker:</label>
              <div className="flex gap-4">
                {Object.entries(brokerInstructions).map(([key, b]) => (
                  <Button
                    key={key}
                    variant={broker === key ? "default" : "outline"}
                    onClick={() => setBroker(key)}
                    className="flex-1 text-lg"
                  >
                    {b.label}
                  </Button>
                ))}
              </div>

              <label className="font-semibold text-lg">Trade Type:</label>
              <select
                className="border rounded px-3 py-2 text-lg"
                value={tradeType}
                onChange={(e) => setTradeType(e.target.value)}
              >
                <option value="stock">Stock</option>
                <option value="options">Options</option>
                <option value="crypto">Crypto</option>
              </select>
            </div>

            {broker && (
              <div className="bg-muted rounded p-4 whitespace-pre-line border border-border">
                <b>Instructions for {brokerInstructions[broker].label}:</b>
                <br />
                {brokerInstructions[broker].instructions}
              </div>
            )}

            <div className="space-y-2">
              <label className="font-semibold text-lg">Upload CSV File:</label>
              <Input type="file" accept=".csv" onChange={handleFileChange} />
            </div>

            <Button
              onClick={handleImport}
              disabled={!file || !broker || uploading}
              className="text-lg py-3"
            >
              {uploading ? "Uploading..." : "Import Trades"}
            </Button>

            {importSummary && (
              <div className="text-center text-lg mt-2">
                <p className="text-green-700 font-semibold">Imported: {importSummary.imported}</p>
                <p className="text-yellow-700 font-semibold">Skipped: {importSummary.skipped}</p>
                {importSummary.errors.length > 0 && (
                  <div className="mt-2 text-red-600">
                    <p className="font-semibold">Errors:</p>
                    <ul className="text-left pl-4">
                      {importSummary.errors.map(([row, msg], i) => (
                        <li key={i}>Row {row}: {msg}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {errorMsg && (
              <p className="text-center text-red-600 whitespace-pre-line">{errorMsg}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
);
}
