'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Search, ArrowRight, Merge, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Instrument {
  id: string;
  symbol: string;
  instrument_type: 'equity' | 'option' | 'future';
  exchange?: string;
  currency?: string;
  multiplier?: number;
  expiry?: string;
  strike?: number;
  option_type?: 'call' | 'put';
  underlying?: string;
  created_at: string;
  execution_count: number;
  alias_count: number;
}

interface MergeResult {
  executionsUpdated: number;
  aliasesMoved: number;
  sourceDeleted: boolean;
  affectedSymbols: string[];
}

export function InstrumentMergeTool() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [sourceSearch, setSourceSearch] = useState('');
  const [targetSearch, setTargetSearch] = useState('');
  const [sourceInstrument, setSourceInstrument] = useState<Instrument | null>(null);
  const [targetInstrument, setTargetInstrument] = useState<Instrument | null>(null);
  const [isMerging, setIsMerging] = useState(false);

  // Search instruments
  const searchInstruments = async (query: string) => {
    if (!query.trim()) return [];
    
    const response = await fetch(`/api/admin/instruments/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to search instruments');
    return response.json();
  };

  const sourceResults = useQuery({
    queryKey: ['instrument-search', 'source', sourceSearch],
    queryFn: () => searchInstruments(sourceSearch),
    enabled: sourceSearch.length >= 2,
    staleTime: 30000,
  });

  const targetResults = useQuery({
    queryKey: ['instrument-search', 'target', targetSearch],
    queryFn: () => searchInstruments(targetSearch),
    enabled: targetSearch.length >= 2,
    staleTime: 30000,
  });

  // Merge mutation
  const mergeMutation = useMutation({
    mutationFn: async ({ sourceId, targetId }: { sourceId: string; targetId: string }) => {
      const response = await fetch('/api/admin/instruments/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, targetId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to merge instruments');
      }
      
      return response.json() as Promise<MergeResult>;
    },
    onSuccess: (result) => {
      toast.success(`Merge completed successfully!`, {
        description: `${result.executionsUpdated} executions updated, ${result.aliasesMoved} aliases moved`,
      });
      
      // Clear selections
      setSourceInstrument(null);
      setTargetInstrument(null);
      setSourceSearch('');
      setTargetSearch('');
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['instrument-search'] });
      
      // Show rebuild prompt
      if (result.affectedSymbols.length > 0) {
        toast.info('Trades need to be rebuilt', {
          description: `Click to rebuild trades for affected symbols: ${result.affectedSymbols.join(', ')}`,
          action: {
            label: 'Rebuild Trades',
            onClick: () => {
              // Navigate to a rebuild page or trigger rebuild
              router.push('/dashboard/import');
            },
          },
        });
      }
    },
    onError: (error: Error) => {
      toast.error('Merge failed', {
        description: error.message,
      });
    },
  });

  const handleMerge = async () => {
    if (!sourceInstrument || !targetInstrument) return;
    
    setIsMerging(true);
    try {
      await mergeMutation.mutateAsync({
        sourceId: sourceInstrument.id,
        targetId: targetInstrument.id,
      });
    } finally {
      setIsMerging(false);
    }
  };

  const canMerge = sourceInstrument && targetInstrument && sourceInstrument.id !== targetInstrument.id;

  return (
    <div className="space-y-6">
      {/* Warning Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Warning:</strong> This operation will permanently merge instruments and cannot be undone. 
          Make sure you have selected the correct source and target instruments.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Instrument Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Source Instrument
            </CardTitle>
            <CardDescription>
              The instrument to be merged (will be deleted)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="source-search">Search Instruments</Label>
              <Input
                id="source-search"
                placeholder="Search by symbol, alias, or instrument details..."
                value={sourceSearch}
                onChange={(e) => setSourceSearch(e.target.value)}
              />
            </div>

            {sourceResults.isLoading && (
              <div className="text-sm text-muted-foreground">Searching...</div>
            )}

            {sourceResults.data && sourceResults.data.length > 0 && (
              <div className="space-y-2">
                <Label>Search Results</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {sourceResults.data.map((instrument: Instrument) => (
                    <div
                      key={instrument.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        sourceInstrument?.id === instrument.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSourceInstrument(instrument)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{instrument.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {instrument.instrument_type} • {instrument.exchange || 'N/A'}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">{instrument.execution_count} execs</Badge>
                          {instrument.alias_count > 0 && (
                            <Badge variant="outline" className="ml-1">{instrument.alias_count} aliases</Badge>
                          )}
                        </div>
                      </div>
                      {instrument.expiry && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Expiry: {instrument.expiry}
                          {instrument.strike && ` • Strike: $${instrument.strike}`}
                          {instrument.option_type && ` • ${instrument.option_type.toUpperCase()}`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sourceResults.data && sourceResults.data.length === 0 && sourceSearch.length >= 2 && (
              <div className="text-sm text-muted-foreground">No instruments found</div>
            )}

            {sourceInstrument && (
              <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Selected: {sourceInstrument.symbol}</div>
                    <div className="text-sm text-muted-foreground">
                      {sourceInstrument.instrument_type} • {sourceInstrument.execution_count} executions
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSourceInstrument(null)}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Target Instrument Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Target Instrument
            </CardTitle>
            <CardDescription>
              The instrument to merge into (will be preserved)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="target-search">Search Instruments</Label>
              <Input
                id="target-search"
                placeholder="Search by symbol, alias, or instrument details..."
                value={targetSearch}
                onChange={(e) => setTargetSearch(e.target.value)}
              />
            </div>

            {targetResults.isLoading && (
              <div className="text-sm text-muted-foreground">Searching...</div>
            )}

            {targetResults.data && targetResults.data.length > 0 && (
              <div className="space-y-2">
                <Label>Search Results</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {targetResults.data.map((instrument: Instrument) => (
                    <div
                      key={instrument.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        targetInstrument?.id === instrument.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setTargetInstrument(instrument)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{instrument.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {instrument.instrument_type} • {instrument.exchange || 'N/A'}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">{instrument.execution_count} execs</Badge>
                          {instrument.alias_count > 0 && (
                            <Badge variant="outline" className="ml-1">{instrument.alias_count} aliases</Badge>
                          )}
                        </div>
                      </div>
                      {instrument.expiry && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Expiry: {instrument.expiry}
                          {instrument.strike && ` • Strike: $${instrument.strike}`}
                          {instrument.option_type && ` • ${instrument.option_type.toUpperCase()}`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {targetResults.data && targetResults.data.length === 0 && targetSearch.length >= 2 && (
              <div className="text-sm text-muted-foreground">No instruments found</div>
            )}

            {targetInstrument && (
              <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Selected: {targetInstrument.symbol}</div>
                    <div className="text-sm text-muted-foreground">
                      {targetInstrument.instrument_type} • {targetInstrument.execution_count} executions
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTargetInstrument(null)}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Merge Preview */}
      {canMerge && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Merge className="h-5 w-5" />
              Merge Preview
            </CardTitle>
            <CardDescription>
              Review the merge operation before proceeding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-4 py-4">
              <div className="text-center">
                <div className="font-medium">{sourceInstrument.symbol}</div>
                <div className="text-sm text-muted-foreground">
                  {sourceInstrument.execution_count} executions
                </div>
                <Badge variant="destructive">Will be deleted</Badge>
              </div>
              
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
              
              <div className="text-center">
                <div className="font-medium">{targetInstrument.symbol}</div>
                <div className="text-sm text-muted-foreground">
                  {targetInstrument.execution_count} executions
                </div>
                <Badge variant="default">Will be preserved</Badge>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-2">
              <div className="text-sm">
                <strong>This operation will:</strong>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Update {sourceInstrument.execution_count} executions to point to {targetInstrument.symbol}</li>
                <li>• Move {sourceInstrument.alias_count} aliases to {targetInstrument.symbol} (deduplicating as needed)</li>
                <li>• Delete the {sourceInstrument.symbol} instrument record</li>
                <li>• Require rebuilding trades for affected symbols</li>
              </ul>
            </div>
            
            <div className="mt-6">
              <Button
                onClick={handleMerge}
                disabled={isMerging}
                className="w-full"
                size="lg"
              >
                {isMerging ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Merging Instruments...
                  </>
                ) : (
                  <>
                    <Merge className="h-4 w-4 mr-2" />
                    Merge Instruments
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
