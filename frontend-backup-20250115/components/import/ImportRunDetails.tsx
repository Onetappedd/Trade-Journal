'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, RefreshCw, AlertCircle, CheckCircle, XCircle, Copy, Trash2 } from 'lucide-react';
import { DeleteImportModal } from './DeleteImportModal';

interface ImportRunDetailsProps {
  runId: string;
}

interface RawImportItem {
  id: string;
  source_line: number;
  status: 'parsed' | 'error' | 'duplicate' | 'retried';
  error?: string;
  raw_payload: any;
  created_at: string;
}

interface ItemsResponse {
  items: RawImportItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface RunDetailsResponse {
  run: {
    id: string;
    source: string;
    status: string;
    started_at: string;
    finished_at?: string;
    summary?: any;
    error?: string;
  };
  itemsSummary: {
    added: number;
    duplicates: number;
    errors: number;
    retried: number;
    total: number;
  };
}

export function ImportRunDetails({ runId }: ImportRunDetailsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'errors' | 'duplicates' | 'parsed'>('all');
  const [page, setPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch run details
  const { data: runDetails, isLoading: runLoading } = useQuery<RunDetailsResponse>({
    queryKey: ['import-run', runId],
    queryFn: async () => {
      const response = await fetch(`/api/import/runs/${runId}`);
      if (!response.ok) throw new Error('Failed to fetch run details');
      return response.json();
    },
  });

  // Fetch items for current tab and page
  const { data: itemsData, isLoading: itemsLoading } = useQuery<ItemsResponse>({
    queryKey: ['import-run-items', runId, activeTab, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });
      
      if (activeTab !== 'all') {
        params.append('status', activeTab === 'parsed' ? 'parsed' : activeTab);
      }
      
      const response = await fetch(`/api/import/runs/${runId}/items?${params}`);
      if (!response.ok) throw new Error('Failed to fetch items');
      return response.json();
    },
    enabled: !!runId,
  });

  // Retry mutation
  const retryMutation = useMutation({
    mutationFn: async (itemIds: string[]) => {
      const response = await fetch(`/api/import/runs/${runId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds }),
      });
      if (!response.ok) throw new Error('Failed to retry items');
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Retry run created with ${data.retriedItems} items`);
      setSelectedItems([]);
      queryClient.invalidateQueries({ queryKey: ['import-run', runId] });
      queryClient.invalidateQueries({ queryKey: ['import-run-items', runId] });
      
      // Navigate to the retry run
      router.push(`/dashboard/import/runs/${data.retryRunId}`);
    },
    onError: (error) => {
      toast.error('Failed to retry items: ' + error.message);
    },
  });

  const handleRetry = () => {
    if (selectedItems.length === 0) {
      toast.error('Please select items to retry');
      return;
    }
    retryMutation.mutate(selectedItems);
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/import/runs/${runId}/delete`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to delete import run');
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Import run deleted. ${data.deletedExecutions} executions removed, ${data.affectedTrades} trades rebuilt.`);
      queryClient.invalidateQueries({ queryKey: ['import-runs'] });
      router.push('/dashboard/import');
    },
    onError: (error) => {
      toast.error('Failed to delete import run: ' + error.message);
    },
  });

  const handleDelete = async () => {
    await deleteMutation.mutateAsync();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(itemsData?.items.map(item => item.id) || []);
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'parsed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'duplicate':
        return <Copy className="h-4 w-4 text-yellow-500" />;
      case 'retried':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      parsed: 'default',
      error: 'destructive',
      duplicate: 'secondary',
      retried: 'outline',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status}
      </Badge>
    );
  };

  if (runLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!runDetails) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Import run not found</h3>
        <p className="text-gray-500 mb-4">The import run you're looking for doesn't exist or you don't have access to it.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const { run, itemsSummary } = runDetails;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Import Run Details</h1>
            <p className="text-muted-foreground">
              {run.source} • {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={run.status === 'success' ? 'default' : run.status === 'failed' ? 'destructive' : 'secondary'}>
            {run.status}
          </Badge>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Import
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{itemsSummary.added}</div>
            <p className="text-xs text-muted-foreground">Successfully Added</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{itemsSummary.errors}</div>
            <p className="text-xs text-muted-foreground">Errors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{itemsSummary.duplicates}</div>
            <p className="text-xs text-muted-foreground">Duplicates</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{itemsSummary.retried}</div>
            <p className="text-xs text-muted-foreground">Retried</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{itemsSummary.total}</div>
            <p className="text-xs text-muted-foreground">Total Items</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Import Items</CardTitle>
              <CardDescription>
                Detailed view of all items in this import run
              </CardDescription>
            </div>
            {activeTab === 'errors' && itemsSummary.errors > 0 && (
              <Button 
                onClick={handleRetry} 
                disabled={selectedItems.length === 0 || retryMutation.isPending}
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Selected ({selectedItems.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => {
            setActiveTab(value as any);
            setPage(1);
            setSelectedItems([]);
          }}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({itemsSummary.total})</TabsTrigger>
              <TabsTrigger value="parsed">Success ({itemsSummary.added})</TabsTrigger>
              <TabsTrigger value="errors">Errors ({itemsSummary.errors})</TabsTrigger>
              <TabsTrigger value="duplicates">Duplicates ({itemsSummary.duplicates})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {itemsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading items...</p>
                </div>
              ) : itemsData?.items.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                  <p className="text-gray-500">
                    {activeTab === 'errors' && 'No errors to display. All items were processed successfully.'}
                    {activeTab === 'duplicates' && 'No duplicates found in this import run.'}
                    {activeTab === 'parsed' && 'No successfully parsed items found.'}
                    {activeTab === 'all' && 'No items found in this import run.'}
                  </p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {activeTab === 'errors' && (
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedItems.length === itemsData?.items.length}
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                        )}
                        <TableHead>Line</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Raw Data</TableHead>
                        <TableHead>Error</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itemsData?.items.map((item) => (
                        <TableRow key={item.id}>
                          {activeTab === 'errors' && (
                            <TableCell>
                              <Checkbox
                                checked={selectedItems.includes(item.id)}
                                onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                              />
                            </TableCell>
                          )}
                          <TableCell className="font-mono text-sm">{item.source_line}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(item.status)}
                              {getStatusBadge(item.status)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate">
                              <pre className="text-xs text-muted-foreground">
                                {JSON.stringify(item.raw_payload, null, 2)}
                              </pre>
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.error && (
                              <div className="max-w-xs">
                                <p className="text-sm text-red-600">{item.error}</p>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {itemsData?.pagination?.totalPages && itemsData.pagination.totalPages > 1 ? (
                    <div className="mt-6">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setPage(p => Math.max(1, p - 1))}
                              className={!itemsData.pagination.hasPrev ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: itemsData.pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                onClick={() => setPage(pageNum)}
                                isActive={pageNum === page}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setPage(p => Math.min(itemsData.pagination.totalPages, p + 1))}
                              className={!itemsData.pagination.hasNext ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                                                 </PaginationContent>
                       </Pagination>
                     </div>
                   ) : null}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Delete Modal */}
      {runDetails && (
        <DeleteImportModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          importRun={{
            id: run.id,
            source: run.source,
            summary: itemsSummary,
            created_at: run.started_at,
          }}
        />
      )}
    </div>
  );
}
