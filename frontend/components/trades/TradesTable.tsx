"use client";

import React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Trade, calcPnL, statusOf, usd } from "@/lib/domain/trades";
import { TradesEmptyState } from "./TradesEmptyState";

interface TradesTableProps {
  data: Trade[];
  onRowClick?: (trade: Trade) => void;
}

const SortableHeader = ({ column, children }: { column: any; children: React.ReactNode }) => {
  const isSorted = column.getIsSorted();
  
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="h-auto p-0 font-semibold hover:bg-transparent"
    >
      {children}
      {isSorted === "asc" ? (
        <ChevronUp className="ml-2 h-4 w-4" />
      ) : isSorted === "desc" ? (
        <ChevronDown className="ml-2 h-4 w-4" />
      ) : (
        <ChevronsUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  );
};

const AssetBadge = ({ assetType }: { assetType: string }) => {
  const variants: Record<string, "default" | "secondary" | "outline"> = {
    stock: "default",
    option: "secondary", 
    futures: "outline",
    crypto: "secondary"
  };
  
  return (
    <Badge variant={variants[assetType] || "default"} className="text-xs">
      {assetType}
    </Badge>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    Open: "outline",
    Partial: "secondary",
    Closed: "default"
  };
  
  return (
    <Badge variant={variants[status] || "default"} className="text-xs">
      {status}
    </Badge>
  );
};

const PnLCell = ({ trade }: { trade: Trade }) => {
  const pnl = calcPnL(trade);
  const isPositive = pnl.total > 0;
  const isNegative = pnl.total < 0;
  
  return (
    <div className="text-right">
      <div className={`font-semibold ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-foreground'}`}>
        {usd(pnl.total)}
      </div>
      <div className="text-xs text-muted-foreground">
        R: {usd(pnl.realized)} • U: {usd(pnl.unrealized)}
      </div>
    </div>
  );
};

export function TradesTable({ data, onRowClick }: TradesTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "opened_at", desc: true }
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const columns: ColumnDef<Trade>[] = [
    {
      accessorKey: "opened_at",
      header: ({ column }) => <SortableHeader column={column}>Date</SortableHeader>,
      cell: ({ row }) => {
        const date = row.getValue("opened_at") as string;
        return format(new Date(date), "MMM d, yyyy");
      },
    },
    {
      accessorKey: "symbol",
      header: ({ column }) => <SortableHeader column={column}>Symbol</SortableHeader>,
      cell: ({ row }) => <div className="font-medium">{row.getValue("symbol")}</div>,
    },
    {
      accessorKey: "asset_type",
      header: "Asset",
      cell: ({ row }) => <AssetBadge assetType={row.getValue("asset_type")} />,
    },
    {
      accessorKey: "side",
      header: ({ column }) => <SortableHeader column={column}>Side</SortableHeader>,
      cell: ({ row }) => <div className="capitalize">{row.getValue("side")}</div>,
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => <SortableHeader column={column}>Qty</SortableHeader>,
      cell: ({ row }) => <div className="text-right tabular-nums">{row.getValue("quantity")}</div>,
    },
    {
      accessorKey: "open_price",
      header: ({ column }) => <SortableHeader column={column}>Open</SortableHeader>,
      cell: ({ row }) => <div className="text-right tabular-nums">{usd(row.getValue("open_price"))}</div>,
    },
    {
      accessorKey: "close_price",
      header: ({ column }) => <SortableHeader column={column}>Close</SortableHeader>,
      cell: ({ row }) => {
        const closePrice = row.getValue("close_price") as number | null;
        return <div className="text-right tabular-nums">{closePrice ? usd(closePrice) : "—"}</div>;
      },
    },
    {
      accessorKey: "fees",
      header: ({ column }) => <SortableHeader column={column}>Fees</SortableHeader>,
      cell: ({ row }) => {
        const fees = row.getValue("fees") as number | null;
        return <div className="text-right tabular-nums">{fees ? usd(fees) : "—"}</div>;
      },
    },
    {
      id: "pnl",
      header: ({ column }) => <SortableHeader column={column}>P&L</SortableHeader>,
      cell: ({ row }) => <PnLCell trade={row.original} />,
    },
    {
      accessorKey: "tags",
      header: "Tags",
      cell: ({ row }) => {
        const tags = row.getValue("tags") as string[] | null;
        if (!tags || tags.length === 0) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: "status",
      header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
      cell: ({ row }) => <StatusBadge status={statusOf(row.original)} />,
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search symbols, tags..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
                         ) : (
               <TableRow>
                 <TableCell colSpan={columns.length} className="p-0">
                   <TradesEmptyState hasFilters={!!globalFilter || Object.keys(columnFilters).length > 0} />
                 </TableCell>
               </TableRow>
             )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
