"use client"

import { useState } from "react"
import Papa from "papaparse"
import { useAuth } from "@/components/auth/auth-provider"

type Broker = "Webull" | "Robinhood"
type AssetType = "Stocks" | "Options" | "Futures"

const WEBULL_OPTIONS_COLUMNS = [
  "Name",
  "Symbol",
  "Side",
  "Status",
  "Filled",
  "Total Qty",
  "Price",
  "Avg Price",
  "Time-in-Force",
  "Placed Time",
  "Filled Time",
]

export default function ImportTradesPage() {
  const [broker, setBroker] = useState<Broker>("Webull")
  const [assetType, setAssetType] = useState<AssetType>("Options")
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [previewRows, setPreviewRows] = useState<any[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; error: number } | null>(null)

  const { user } = useAuth()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError(null)
    setPreviewRows([])
    setImportResult(null)
    const file = e.target.files?.[0]
    setCsvFile(file || null)
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (broker === "Webull" && assetType === "Options") {
            // Validate columns
            const columns = Object.keys((results.data as any[])[0] || {})
            const missing = WEBULL_OPTIONS_COLUMNS.filter((col) => !columns.includes(col))
            if (missing.length > 0) {
              setParseError("Missing columns: " + missing.join(", "))
              return
            }
            // Only show first 5 rows, only 'Filled'
            const filledRows = (results.data as any[]).filter((row) => row.Status === "Filled")
            setPreviewRows(filledRows.slice(0, 5))
          } else {
            setParseError("Only Webull + Options is supported in this version.")
          }
        },
        error: (err) => setParseError(err.message),
      })
    }
  }

  const mapWebullOptionRow = (row: any) => {
    const filledTime = row["Filled Time"] ? new Date(row["Filled Time"]) : null
    return {
      symbol: row.Symbol,
      side: (row.Side || "").toLowerCase(),
      quantity: Number(row["Total Qty"]) || 0,
      entry_price: Number(row["Avg Price"]) || 0,
      entry_date: filledTime ? filledTime.toISOString() : null,
      asset_type: "option",
      broker: "Webull",
    }
  }

  const handleImport = async () => {
    if (!csvFile || !user) return
    setImporting(true)
    setImportResult(null)
    setParseError(null)

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        if (broker === "Webull" && assetType === "Options") {
          const rows = (results.data as any[]).filter((row) => row.Status === "Filled")
          // Map to trade objects
          const trades = rows.map(mapWebullOptionRow).filter((t) => t.symbol && t.entry_date)
          // POST to API
          const res = await fetch("/api/import-trades", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ trades }),
          })
          const json = await res.json()
          setImportResult(json)
        }
        setImporting(false)
      },
      error: (err) => {
        setParseError(err.message)
        setImporting(false)
      },
    })
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Import Trades</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block font-medium mb-1">Broker</label>
          <select className="w-full border rounded p-2" value={broker} onChange={(e) => setBroker(e.target.value as Broker)}>
            <option>Webull</option>
            <option>Robinhood</option>
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Asset Type</label>
          <select className="w-full border rounded p-2" value={assetType} onChange={(e) => setAssetType(e.target.value as AssetType)}>
            <option>Stocks</option>
            <option>Options</option>
            <option>Futures</option>
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">CSV File</label>
          <input type="file" accept=".csv" onChange={handleFileChange} />
        </div>
      </div>

      {parseError && <div className="text-red-600">{parseError}</div>}

      {previewRows.length > 0 && (
        <div>
          <div className="font-medium mb-2">Preview (first 5 filled rows)</div>
          <div className="overflow-x-auto border rounded">
            <table className="table-auto w-full text-xs">
              <thead>
                <tr>
                  {Object.keys(previewRows[0]).map((col) => (
                    <th key={col} className="border px-2 py-1 text-left">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="border px-2 py-1">{String(val)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <button className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50" disabled={!csvFile || importing || !!parseError} onClick={handleImport}>
        {importing ? "Importing..." : "Import Trades"}
      </button>

      {importResult && (
        <div className="mt-4">
          <span className="text-green-700 font-semibold">{importResult.success} trades imported.</span>
          {importResult.error > 0 && <span className="text-red-600 ml-2">{importResult.error} errors.</span>}
        </div>
      )}
    </div>
  )
}
