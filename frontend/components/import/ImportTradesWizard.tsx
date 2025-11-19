'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL as string) || 'http://localhost:8000';

const BROKERS = [
  { id: 'webull', name: 'Webull' },
  { id: 'robinhood', name: 'Robinhood' },
  { id: 'ibkr', name: 'Interactive Brokers' },
  { id: 'schwab', name: 'Charles Schwab' },
  { id: 'fidelity', name: 'Fidelity' },
  { id: 'etrade', name: 'E*TRADE' },
  { id: 'tastytrade', name: 'Tastytrade' },
  { id: 'tradestation', name: 'TradeStation' },
  { id: 'coinbase', name: 'Coinbase' },
  { id: 'kraken', name: 'Kraken' },
  { id: 'binanceus', name: 'BinanceUS' },
];

const ASSET_CLASSES = [
  { id: 'stocks', label: 'Common Stock' },
  { id: 'options', label: 'Options' },
  { id: 'futures', label: 'Futures' },
  { id: 'crypto', label: 'Crypto' },
];

type DetectResult = {
  brokerGuess: string;
  assetGuess: 'stocks' | 'options' | 'futures' | 'crypto';
  schemaId: string;
  confidence: number;
  headerMap: Record<string, string>;
  warnings: string[];
};

// Normalized fields we support in mapping
const NORMALIZED_FIELDS = [
  'symbol',
  'quantity',
  'price',
  'execTime',
  'fees',
  'side',
  'expiry',
  'strike',
  'right',
  'accountIdExternal',
  'orderId',
  'tradeIdExternal',
];

function useLocalMapping(brokerId?: string, schemaId?: string) {
  const key = brokerId && schemaId ? `mapping:${brokerId}:${schemaId}` : undefined;
  const load = useCallback(() => {
    if (!key) return undefined;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as Record<string, string>) : undefined;
    } catch {
      return undefined;
    }
  }, [key]);
  const save = useCallback(
    (map: Record<string, string>) => {
      if (!key) return;
      try {
        localStorage.setItem(key, JSON.stringify(map));
      } catch {}
    },
    [key],
  );
  return { load, save };
}

function normalizeHeaders(headers: string[]): string[] {
  return headers.map((h) => h.trim());
}

function parseCsvSample(file: File, maxRows = 200): Promise<{ headers: string[]; rows: any[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      worker: false, // Disable worker to avoid CSP issues
      skipEmptyLines: true,
      preview: maxRows,
      complete: (res) => {
        const headers = (res.meta?.fields || []) as string[];
        const rows = (res.data || []) as any[];
        resolve({ headers, rows });
      },
      error: (err) => reject(err),
    });
  });
}

function validateRows(
  rows: any[],
  mapping: Record<string, string>,
  assetClass: string,
): {
  errors: Array<{ row: number; message: string }>;
  warnings: string[];
  duplicates: number;
  invalidRows: Set<number>;
} {
  const errors: Array<{ row: number; message: string }> = [];
  const warnings: string[] = [];
  const invalidRows = new Set<number>();
  const seenTradeIds = new Set<string>();
  const seenTuple = new Set<string>();

  const required = ['symbol', 'quantity', 'price', 'execTime'];
  const optionsReq = ['strike', 'right', 'expiry'];

  rows.forEach((r, idx) => {
    const rowNum = idx + 1;
    // Required presence
    for (const f of required) {
      const col = Object.keys(mapping).find((k) => mapping[k] === f);
      const val = col ? r[col] : undefined;
      if (val === undefined || val === '') {
        errors.push({ row: rowNum, message: `Missing required field: ${f}` });
        invalidRows.add(idx);
      }
    }
    if (assetClass === 'options') {
      for (const f of optionsReq) {
        const col = Object.keys(mapping).find((k) => mapping[k] === f);
        const val = col ? r[col] : undefined;
        if (val === undefined || val === '') {
          errors.push({ row: rowNum, message: `Option requires ${f}` });
          invalidRows.add(idx);
        }
      }
    }
    // Numeric checks
    const qCol = Object.keys(mapping).find((k) => mapping[k] === 'quantity');
    const pCol = Object.keys(mapping).find((k) => mapping[k] === 'price');
    const fCol = Object.keys(mapping).find((k) => mapping[k] === 'fees');
    const q = qCol ? Number(String(r[qCol]).replace(/,/g, '')) : NaN;
    const p = pCol ? Number(String(r[pCol]).replace(/,/g, '')) : NaN;
    const fee =
      fCol && r[fCol] !== undefined ? Number(String(r[fCol]).replace(/,/g, '')) : undefined;
    if (!Number.isFinite(q)) {
      errors.push({ row: rowNum, message: 'Quantity is not a number' });
      invalidRows.add(idx);
    }
    if (!Number.isFinite(p)) {
      errors.push({ row: rowNum, message: 'Price is not a number' });
      invalidRows.add(idx);
    }
    if (fee !== undefined && !Number.isFinite(fee)) {
      warnings.push(`Row ${rowNum}: Fees not numeric, ignored`);
    }
    // Timestamp
    const tCol = Object.keys(mapping).find((k) => mapping[k] === 'execTime');
    const tRaw = tCol ? r[tCol] : undefined;
    const t = tRaw ? new Date(tRaw) : undefined;
    if (!t || isNaN(t.getTime())) {
      errors.push({ row: rowNum, message: 'Invalid timestamp' });
      invalidRows.add(idx);
    }
    // Aggregates
    const tidCol = Object.keys(mapping).find((k) => mapping[k] === 'tradeIdExternal');
    const tid = tidCol ? String(r[tidCol]) : undefined;
    if (tid) {
      if (seenTradeIds.has(tid)) {
        warnings.push(`Duplicate tradeIdExternal at row ${rowNum}`);
      }
      seenTradeIds.add(tid);
    }
    const symCol = Object.keys(mapping).find((k) => mapping[k] === 'symbol');
    const tupleKey = `${t?.toISOString() || ''}|${symCol ? r[symCol] : ''}|${Number.isFinite(q) ? q : ''}|${Number.isFinite(p) ? p : ''}`;
    if (seenTuple.has(tupleKey)) {
      warnings.push(`Duplicate tuple (time,symbol,qty,price) at row ${rowNum}`);
    }
    seenTuple.add(tupleKey);
  });

  const duplicates = warnings.filter((w) => w.includes('Duplicate')).length;
  return { errors, warnings, duplicates, invalidRows };
}

function buildPreview(rows: any[], mapping: Record<string, string>, limit = 50) {
  const out = [] as any[];
  const headers = Object.keys(mapping);
  for (let i = 0; i < Math.min(rows.length, limit); i++) {
    const row = rows[i];
    const norm: any = {};
    for (const src of headers) {
      const target = mapping[src];
      if (!target) continue;
      norm[target] = row[src];
    }
    out.push(norm);
  }
  return out;
}

function computeTotals(preview: any[]) {
  const bySymbol = new Map<string, number>();
  let totalFees = 0;
  let earliest: Date | undefined;
  let latest: Date | undefined;
  for (const r of preview) {
    if (r.symbol && typeof r.quantity !== 'undefined') {
      const q = Number(String(r.quantity).replace(/,/g, ''));
      bySymbol.set(r.symbol, (bySymbol.get(r.symbol) || 0) + (Number.isFinite(q) ? q : 0));
    }
    if (typeof r.fees !== 'undefined') {
      const f = Number(String(r.fees).replace(/,/g, ''));
      if (Number.isFinite(f)) totalFees += Math.abs(f);
    }
    if (r.execTime) {
      const d = new Date(r.execTime);
      if (!isNaN(d.getTime())) {
        if (!earliest || d < earliest) earliest = d;
        if (!latest || d > latest) latest = d;
      }
    }
  }
  return { bySymbol, totalFees, earliest, latest };
}

export function ImportTradesWizard() {
  const [step, setStep] = useState<
    | 'chooseBroker'
    | 'chooseAssetType'
    | 'upload'
    | 'detecting'
    | 'preview'
    | 'importing'
    | 'done'
    | 'error'
  >('chooseBroker');
  const [brokerId, setBrokerId] = useState<string | undefined>(undefined);
  const [assetClass, setAssetClass] = useState<
    'stocks' | 'options' | 'futures' | 'crypto' | undefined
  >(undefined);
  const [file, setFile] = useState<File | undefined>(undefined);
  const [fileInfo, setFileInfo] = useState<
    { name: string; size: number; type: string } | undefined
  >(undefined);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [detect, setDetect] = useState<DetectResult | undefined>(undefined);
  const [headerMap, setHeaderMap] = useState<Record<string, string>>({});
  const [helpOpen, setHelpOpen] = useState(false);
  const [mappingOpen, setMappingOpen] = useState(false);
  const [skipInvalid, setSkipInvalid] = useState(true);
  const [errorsCsvUrl, setErrorsCsvUrl] = useState<string | undefined>(undefined);

  const mappingStore = useLocalMapping(detect?.brokerGuess || brokerId, detect?.schemaId);

  const canNextFromBroker = !!brokerId;
  const canNextFromAsset = !!assetClass;
  const canNextFromUpload = !!file;

  // Handle detection
  const runDetect = useCallback(async () => {
    if (!file) return;
    setStep('detecting');
    try {
      const form = new FormData();
      form.append('file', file);
      if (brokerId) form.append('userBrokerId', brokerId);
      if (assetClass) form.append('userAssetClass', assetClass);
      const res = await fetch(`${API_BASE_URL}/import/detect`, { method: 'POST', body: form });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as DetectResult;
      setDetect(data);
      // Parse a sample of CSV/XLSX via Papa (CSV) or fallback
      const { headers: h, rows: r } = await parseCsvSample(file, 200);
      const normHeaders = normalizeHeaders(h);
      setHeaders(normHeaders);
      // Merge header map with stored mapping override
      let map: Record<string, string> = {};
      for (const src of normHeaders) {
        // prefer stored mapping
        const stored = mappingStore.load()?.[src];
        map[src] = stored || data.headerMap[src] || '';
      }
      setHeaderMap(map);
      setRows(r);
      setStep('preview');
    } catch (e: any) {
      console.error(e);
      setStep('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, brokerId, assetClass]);

  // Validation and preview
  const { errors, warnings, duplicates, invalidRows } = useMemo(
    () => validateRows(rows, headerMap, assetClass || 'stocks'),
    [rows, headerMap, assetClass],
  );
  const previewRowsRaw = useMemo(() => buildPreview(rows, headerMap, 50), [rows, headerMap]);
  const previewRows = useMemo(
    () => (skipInvalid ? previewRowsRaw.filter((_, idx) => !invalidRows.has(idx)) : previewRowsRaw),
    [previewRowsRaw, skipInvalid, invalidRows],
  );
  const totals = useMemo(() => computeTotals(previewRows), [previewRows]);

  // Errors CSV
  useEffect(() => {
    if (!errors.length) {
      if (errorsCsvUrl) URL.revokeObjectURL(errorsCsvUrl);
      setErrorsCsvUrl(undefined);
      return;
    }
    const header = ['row', 'message'];
    const lines = [
      header.join(','),
      ...errors.map((e) => `${e.row},"${e.message.replace(/"/g, '""')}"`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    setErrorsCsvUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors]);

  // Mapping Drawer content
  const MappingDrawer = () => {
    const [localMap, setLocalMap] = useState<Record<string, string>>({ ...headerMap });
    const onSave = () => {
      setHeaderMap(localMap);
      mappingStore.save(localMap);
      setMappingOpen(false);
    };
    return (
      <Dialog open={mappingOpen} onOpenChange={setMappingOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Map Columns</DialogTitle>
            <DialogDescription>
              Adjust how your file headers map to normalized fields.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-auto">
            <div>
              <h4 className="font-semibold mb-2">File Headers</h4>
              {headers.map((h) => (
                <div key={h} className="flex items-center justify-between gap-2 py-1">
                  <span className="text-sm">{h}</span>
                  <select
                    className="text-sm border rounded px-2 py-1"
                    value={localMap[h] || ''}
                    onChange={(e) => setLocalMap((prev) => ({ ...prev, [h]: e.target.value }))}
                  >
                    <option value="">— ignore —</option>
                    {NORMALIZED_FIELDS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div>
              <h4 className="font-semibold mb-2">Normalized Fields</h4>
              <ul className="text-sm text-muted-foreground list-disc pl-5">
                <li>symbol, quantity, price, execTime are required</li>
                {assetClass === 'options' && <li>Options require strike, right, expiry</li>}
              </ul>
              <Separator className="my-2" />
              <div className="space-y-1">
                {NORMALIZED_FIELDS.map((f) => (
                  <div key={f} className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{f}</span>
                    <span className="text-xs text-muted-foreground">
                      {Object.keys(localMap).find((k) => localMap[k] === f) || '(unassigned)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setMappingOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onSave}>Save Mapping</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Steps UI
  if (step === 'chooseBroker') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select your broker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {BROKERS.map((broker) => (
              <Button
                key={broker.id}
                variant={brokerId === broker.id ? 'default' : 'outline'}
                className="flex flex-col items-center p-4"
                onClick={() => setBrokerId(broker.id)}
              >
                <span className="font-semibold mt-2">{broker.name}</span>
              </Button>
            ))}
          </div>
          <div className="mt-4 flex justify-between">
            <Button
              variant="outline"
              disabled={!canNextFromBroker}
              onClick={() => setStep('chooseAssetType')}
            >
              Next
            </Button>
            <Button variant="ghost" onClick={() => setHelpOpen(true)} disabled={!brokerId}>
              Where to find your export?
            </Button>
          </div>
          <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  How to export from {BROKERS.find((b) => b.id === brokerId)?.name || 'your broker'}
                </DialogTitle>
              </DialogHeader>
              {(() => {
                // Dynamic help content from config
                const { BROKER_EXPORT_GUIDES } = require('@/config/broker-export-guides');
                const guide =
                  (brokerId && BROKER_EXPORT_GUIDES[brokerId]) || BROKER_EXPORT_GUIDES.generic;
                return (
                  <div className="space-y-3">
                    <div className="text-sm font-medium">{guide.title}</div>
                    <ol className="list-decimal pl-5 space-y-2 text-sm">
                      {guide.steps.map((s: any, i: number) => (
                        <li key={i}>
                          <div className="font-medium">{s.title}</div>
                          <div className="text-muted-foreground">{s.detail}</div>
                        </li>
                      ))}
                    </ol>
                    {guide.notes && guide.notes.length > 0 && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        {guide.notes.map((n: string, i: number) => (
                          <div key={i}>• {n}</div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
              <div className="mt-4 flex justify-end">
                <DialogClose asChild>
                  <Button>Close</Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  if (step === 'chooseAssetType') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select asset type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {ASSET_CLASSES.map((asset) => (
              <Button
                key={asset.id}
                variant={assetClass === asset.id ? 'default' : 'outline'}
                onClick={() => setAssetClass(asset.id as any)}
              >
                {asset.label}
              </Button>
            ))}
          </div>
          <div className="mt-4 flex justify-between">
            <Button variant="outline" onClick={() => setStep('chooseBroker')}>
              Back
            </Button>
            <Button
              variant="outline"
              disabled={!canNextFromAsset}
              onClick={() => setStep('upload')}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'upload') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upload your trade file</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Input
              type="file"
              accept=".csv,.xlsx"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setFile(f);
                  setFileInfo({ name: f.name, size: f.size, type: f.type });
                }
              }}
            />
            {fileInfo && (
              <div className="text-sm text-muted-foreground">
                {fileInfo.name} • {(fileInfo.size / 1024).toFixed(1)} KB
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('chooseAssetType')}>
                Back
              </Button>
              <Button variant="default" disabled={!canNextFromUpload} onClick={runDetect}>
                Analyze
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'detecting') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detecting file format…</CardTitle>
        </CardHeader>
        <CardContent>
          <div>Analyzing your file…</div>
          <div className="mt-4">
            <Button variant="outline" onClick={() => setStep('upload')}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'preview') {
    const allInvalid = previewRows.length === 0 && rows.length > 0;
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Preview & Map Columns</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setMappingOpen(true)}>
                Re-map columns
              </Button>
              {errorsCsvUrl && (
                <a href={errorsCsvUrl} download="import-errors.csv">
                  <Button variant="outline">Download Errors CSV</Button>
                </a>
              )}
            </div>
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            Rows: {rows.length} • Errors: {errors.length} • Warnings: {warnings.length} •
            Duplicates: {duplicates}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input
              id="skipInvalid"
              type="checkbox"
              checked={skipInvalid}
              onChange={(e) => setSkipInvalid(e.target.checked)}
            />
            <Label htmlFor="skipInvalid">Skip invalid rows</Label>
            {skipInvalid && (
              <span className="text-xs text-muted-foreground">(skipping {invalidRows.size})</span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Column badges */}
          <div className="overflow-auto">
            <table className="w-full text-sm border">
              <thead>
                <tr>
                  {headers.map((h) => (
                    <th key={h} className="px-2 py-1 border-b text-left">
                      <div className="flex flex-col">
                        <span>{h}</span>
                        <span className="text-xs text-muted-foreground">
                          {headerMap[h] || '(unassigned)'}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((row, idx) => {
                  if (skipInvalid && invalidRows.has(idx)) return null;
                  return (
                    <tr key={idx} className="border-t">
                      {headers.map((h) => (
                        <td key={h} className="px-2 py-1 align-top">
                          {String(row[h] ?? '')}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Totals */}
          <div className="mt-4 text-sm">
            <div className="font-semibold mb-1">Totals (preview only)</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <div className="text-muted-foreground">Quantity by Symbol</div>
                {[...totals.bySymbol.entries()].slice(0, 10).map(([sym, qty]) => (
                  <div key={sym}>
                    {sym}: {qty}
                  </div>
                ))}
                {totals.bySymbol.size > 10 && <div>…</div>}
              </div>
              <div>
                <div className="text-muted-foreground">Total Fees</div>
                <div>${totals.totalFees.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Time Range</div>
                <div>
                  {totals.earliest ? new Date(totals.earliest).toLocaleString() : '—'} →{' '}
                  {totals.latest ? new Date(totals.latest).toLocaleString() : '—'}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-between">
            <Button variant="outline" onClick={() => setStep('upload')}>
              Back
            </Button>
            <Button variant="default" disabled={allInvalid} onClick={() => setStep('importing')}>
              Continue
            </Button>
          </div>
        </CardContent>
        <MappingDrawer />
      </Card>
    );
  }

  if (step === 'importing') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Importing…</CardTitle>
        </CardHeader>
        <CardContent>
          <div>Importing your trades… (progress will appear here)</div>
          <div className="mt-4 flex justify-between">
            <Button variant="outline" onClick={() => setStep('preview')}>
              Cancel
            </Button>
            <Button variant="default" onClick={() => setStep('done')}>
              Finish
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'done') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import Complete</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            Summary will appear here (rows imported, duplicates skipped, errors file, impacted
            accounts, earliest/latest fill).
          </div>
          <Button
            variant="default"
            onClick={() => {
              setStep('chooseBroker');
              setBrokerId(undefined);
              setAssetClass(undefined);
              setFile(undefined);
              setDetect(undefined);
              setHeaderMap({});
              setHeaders([]);
              setRows([]);
            }}
          >
            Start Over
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'error') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 mb-4">
            An error occurred. Please review your file and try again.
          </div>
          <Button variant="default" onClick={() => setStep('chooseBroker')}>
            Start Over
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
