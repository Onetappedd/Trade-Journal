"use client";

import React from "react";
import { format } from "date-fns";
import { CalendarIcon, Filter, X } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Trade, calcPnL, usd } from "@/lib/domain/trades";

interface TradesToolbarProps {
  data: Trade[];
  onFiltersChange: (filters: TradeFilters) => void;
}

export interface TradeFilters {
  search?: string;
  assetType?: string[];
  side?: string[];
  status?: string[];
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
}

const ASSET_TYPES = [
  { value: "all", label: "All assets" },
  { value: "stock", label: "Stock" },
  { value: "option", label: "Option" },
  { value: "futures", label: "Futures" },
  { value: "crypto", label: "Crypto" },
];

const SIDES = [
  { value: "all", label: "All sides" },
  { value: "Buy", label: "Buy" },
  { value: "Sell", label: "Sell" },
];

const STATUSES = [
  { value: "all", label: "All statuses" },
  { value: "Open", label: "Open" },
  { value: "Partial", label: "Partial" },
  { value: "Closed", label: "Closed" },
];

export function TradesToolbar({ data, onFiltersChange }: TradesToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = React.useState<TradeFilters>({
    search: searchParams.get("search") || "",
    assetType: searchParams.getAll("assetType").length > 0 ? searchParams.getAll("assetType") : ["all"],
    side: searchParams.getAll("side").length > 0 ? searchParams.getAll("side") : ["all"],
    status: searchParams.getAll("status").length > 0 ? searchParams.getAll("status") : ["all"],
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
    tags: searchParams.getAll("tags"),
  });

  const updateFilters = (newFilters: Partial<TradeFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange(updated);
    
    // Update URL params
    const params = new URLSearchParams();
    if (updated.search) params.set("search", updated.search);
    updated.assetType?.filter(type => type !== "all").forEach(type => params.append("assetType", type));
    updated.side?.filter(side => side !== "all").forEach(side => params.append("side", side));
    updated.status?.filter(status => status !== "all").forEach(status => params.append("status", status));
    if (updated.dateFrom) params.set("dateFrom", updated.dateFrom);
    if (updated.dateTo) params.set("dateTo", updated.dateTo);
    updated.tags?.forEach(tag => params.append("tags", tag));
    
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    const cleared = {
      search: "",
      assetType: ["all"],
      side: ["all"],
      status: ["all"],
      dateFrom: "",
      dateTo: "",
      tags: [],
    };
    setFilters(cleared);
    onFiltersChange(cleared);
    router.push(pathname);
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'search' && value !== "") return true;
    if (key === 'dateFrom' && value !== "") return true;
    if (key === 'dateTo' && value !== "") return true;
    if (key === 'tags' && Array.isArray(value) && value.length > 0) return true;
    if (Array.isArray(value) && value.length > 0 && !value.includes("all")) return true;
    return false;
  });

  // Calculate summary from filtered data
  const summary = React.useMemo(() => {
    const totalPnL = data.reduce((sum, trade) => {
      const pnl = calcPnL(trade);
      return sum + pnl.total;
    }, 0);
    
    const realizedPnL = data.reduce((sum, trade) => {
      const pnl = calcPnL(trade);
      return sum + pnl.realized;
    }, 0);
    
    const unrealizedPnL = data.reduce((sum, trade) => {
      const pnl = calcPnL(trade);
      return sum + pnl.unrealized;
    }, 0);

    return {
      count: data.length,
      totalPnL,
      realizedPnL,
      unrealizedPnL,
    };
  }, [data]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filters</span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="ml-auto"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Symbol, tags..."
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
              />
            </div>

            {/* Asset Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Asset Type</label>
              <Select
                value={filters.assetType?.[0] || "all"}
                onValueChange={(value) => 
                  updateFilters({ assetType: [value] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All assets" />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Side */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Side</label>
              <Select
                value={filters.side?.[0] || "all"}
                onValueChange={(value) => 
                  updateFilters({ side: [value] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All sides" />
                </SelectTrigger>
                <SelectContent>
                  {SIDES.map((side) => (
                    <SelectItem key={side.value} value={side.value}>
                      {side.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status?.[0] || "all"}
                onValueChange={(value) => 
                  updateFilters({ status: [value] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date From</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFrom ? format(new Date(filters.dateFrom), "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
                    onSelect={(date) => 
                      updateFilters({ dateFrom: date ? format(date, "yyyy-MM-dd") : "" })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date To</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateTo ? format(new Date(filters.dateTo), "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
                    onSelect={(date) => 
                      updateFilters({ dateTo: date ? format(date, "yyyy-MM-dd") : "" })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              {filters.search && (
                <Badge variant="secondary" className="gap-1">
                  Search: {filters.search}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => updateFilters({ search: "" })}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
                             {filters.assetType?.filter(type => type !== "all").map((type) => (
                 <Badge key={type} variant="secondary" className="gap-1">
                   Asset: {type}
                   <Button
                     variant="ghost"
                     size="sm"
                     className="h-auto p-0 ml-1"
                     onClick={() => updateFilters({ assetType: ["all"] })}
                   >
                     <X className="h-3 w-3" />
                   </Button>
                 </Badge>
               ))}
                             {filters.side?.filter(side => side !== "all").map((side) => (
                 <Badge key={side} variant="secondary" className="gap-1">
                   Side: {side}
                   <Button
                     variant="ghost"
                     size="sm"
                     className="h-auto p-0 ml-1"
                     onClick={() => updateFilters({ side: ["all"] })}
                   >
                     <X className="h-3 w-3" />
                   </Button>
                 </Badge>
               ))}
                             {filters.status?.filter(status => status !== "all").map((status) => (
                 <Badge key={status} variant="secondary" className="gap-1">
                   Status: {status}
                   <Button
                     variant="ghost"
                     size="sm"
                     className="h-auto p-0 ml-1"
                     onClick={() => updateFilters({ status: ["all"] })}
                   >
                     <X className="h-3 w-3" />
                   </Button>
                 </Badge>
               ))}
              {filters.dateFrom && (
                <Badge variant="secondary" className="gap-1">
                  From: {format(new Date(filters.dateFrom), "MMM d")}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => updateFilters({ dateFrom: "" })}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filters.dateTo && (
                <Badge variant="secondary" className="gap-1">
                  To: {format(new Date(filters.dateTo), "MMM d")}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => updateFilters({ dateTo: "" })}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{summary.count}</div>
              <div className="text-sm text-muted-foreground">Trades</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${summary.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {usd(summary.totalPnL)}
              </div>
              <div className="text-sm text-muted-foreground">Total P&L</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${summary.realizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {usd(summary.realizedPnL)}
              </div>
              <div className="text-sm text-muted-foreground">Realized</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${summary.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {usd(summary.unrealizedPnL)}
              </div>
              <div className="text-sm text-muted-foreground">Unrealized</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
