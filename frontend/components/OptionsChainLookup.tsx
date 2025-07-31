"use client";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";

interface OptionContract {
  symbol: string;
  type: "Call" | "Put";
  strike: number;
  expiry: string;
  premium: number;
  contracts: number;
  bid?: number;
  ask?: number;
  last?: number;
  volume?: number;
  openInterest?: number;
  iv?: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
}

interface OptionsChainLookupProps {
  symbol: string;
  expiry: string;
  onSelectContract: (contract: OptionContract) => void;
}

export default function OptionsChainLookup({ symbol, expiry, onSelectContract }: OptionsChainLookupProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<OptionContract[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchOptionsChain = async () => {
    setLoading(true);
    setError(null);
    setContracts([]);
    try {
      const res = await fetch(`/api/options-chain?symbol=${encodeURIComponent(symbol)}&expiry=${encodeURIComponent(expiry)}`);
      if (!res.ok) throw new Error("Failed to fetch options chain");
      const data = await res.json();
      setContracts(data.contracts || []);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button type="button" variant="secondary" className="w-full md:w-auto" onClick={() => { setOpen(true); fetchOptionsChain(); }}>
        Lookup Options Chain
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>Options Chain for {symbol.toUpperCase()} ({expiry})</DialogTitle>
          </DialogHeader>
          {loading && <div className="p-4 text-center">Loading...</div>}
          {error && <div className="p-4 text-destructive">{error}</div>}
          {!loading && !error && contracts.length > 0 && (
            <div className="overflow-x-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Strike</TableHead>
                    <TableHead>Bid</TableHead>
                    <TableHead>Ask</TableHead>
                    <TableHead>Last</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>OI</TableHead>
                    <TableHead>IV</TableHead>
                    <TableHead>Delta</TableHead>
                    <TableHead>Gamma</TableHead>
                    <TableHead>Theta</TableHead>
                    <TableHead>Vega</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell>{c.type}</TableCell>
                      <TableCell>{c.strike}</TableCell>
                      <TableCell>{c.bid ?? "-"}</TableCell>
                      <TableCell>{c.ask ?? "-"}</TableCell>
                      <TableCell>{c.last ?? "-"}</TableCell>
                      <TableCell>{c.volume ?? "-"}</TableCell>
                      <TableCell>{c.openInterest ?? "-"}</TableCell>
                      <TableCell>{c.iv ?? "-"}</TableCell>
                      <TableCell>{c.delta ?? "-"}</TableCell>
                      <TableCell>{c.gamma ?? "-"}</TableCell>
                      <TableCell>{c.theta ?? "-"}</TableCell>
                      <TableCell>{c.vega ?? "-"}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="default" onClick={() => { onSelectContract(c); setOpen(false); }}>
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && !error && contracts.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">No contracts found.</div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
