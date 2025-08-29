'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { ImportResultModal } from './ImportResultModal';
import { ImportRun, ImportSource, ImportStatus } from '@/lib/types/imports';
import { formatDistanceToNow } from 'date-fns';
import { Eye, Calendar, Filter } from 'lucide-react';

interface ImportRunsResponse {
  items: ImportRun[];
  total: number;
  page: number;
  limit: number;
}

const SOURCES: { value: ImportSource; label: string }[] = [
  { value: 'csv', label: 'CSV Import' },
  { value: 'email', label: 'Email' },
  { value: 'manual', label: 'Manual' },
  { value: 'api', label: 'API' },
];

const STATUSES: { value: ImportStatus; label: string; variant: 'default' | 'secondary' | 'destructive' }[] = [
  { value: 'pending', label: 'Pending', variant: 'secondary' },
  { value: 'processing', label: 'Processing', variant: 'secondary' },
  { value: 'partial', label: 'Partial', variant: 'default' },
  { value: 'success', label: 'Success', variant: 'default' },
  { value: 'failed', label: 'Failed', variant: 'destructive' },
];

export function ImportHistoryTable() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    source: '',
    dateFrom: '',
    dateTo: '',
  });
  const [selectedRun, setSelectedRun] = useState<ImportRun | null>(null);

  const fetchImportRuns = async (): Promise<ImportRunsResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '25',
      ...(filters.status && { status: filters.status }),
      ...(filters.source && { source: filters.source }),
      ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
      ...(filters.dateTo && { dateTo: filters.dateTo }),
    });

    const response = await fetch(`/api/import/runs?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch import runs');
    }
    return response.json();
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['import-runs', page, filters],
    queryFn: fetchImportRuns,
    placeholderData: (previousData) => previousData,
  });

  const getStatusBadge = (status: ImportStatus) => {
    const statusConfig = STATUSES.find(s => s.value === status);
    return (
      <Badge variant={statusConfig?.variant || 'secondary'}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const getSourceLabel = (source: ImportSource) => {
    const sourceConfig = SOURCES.find(s => s.value === source);
    return sourceConfig?.label || source;
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Failed to load import history. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Import History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                {STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.source} onValueChange={(value) => setFilters(prev => ({ ...prev, source: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Sources</SelectItem>
                {SOURCES.map((source) => (
                  <SelectItem key={source.value} value={source.value}>
                    {source.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="From"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-32"
            />

            <Input
              type="date"
              placeholder="To"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="w-32"
            />
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Started</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Duplicates</TableHead>
                  <TableHead>Errors</TableHead>
                  <TableHead>Finished</TableHead>
                  <TableHead className="w-20">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading import history...
                    </TableCell>
                  </TableRow>
                ) : data?.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No import runs found
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.items.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell>
                        {run.started_at ? (
                          <div>
                            <div className="font-medium">
                              {new Date(run.started_at).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getSourceLabel(run.source)}</TableCell>
                      <TableCell>{getStatusBadge(run.status)}</TableCell>
                      <TableCell>
                        {run.summary?.added || 0}
                      </TableCell>
                      <TableCell>
                        {run.summary?.duplicates || 0}
                      </TableCell>
                      <TableCell>
                        {run.summary?.errors || 0}
                      </TableCell>
                      <TableCell>
                        {run.finished_at ? (
                          <div>
                            <div className="font-medium">
                              {new Date(run.finished_at).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(run.finished_at), { addSuffix: true })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRun(run)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage(prev => Math.max(1, prev - 1))}
                      className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setPage(pageNum)}
                          isActive={page === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                      className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Result Modal */}
      {selectedRun && (
        <ImportResultModal
          importRun={selectedRun}
          onClose={() => setSelectedRun(null)}
        />
      )}
    </>
  );
}
