import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FileText } from "lucide-react";
import Link from "next/link";

interface TradesEmptyStateProps {
  hasFilters?: boolean;
}

export function TradesEmptyState({ hasFilters = false }: TradesEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <h3 className="text-lg font-semibold mb-2">
          {hasFilters ? "No trades match your filters" : "No trades yet"}
        </h3>
        
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          {hasFilters 
            ? "Try adjusting your filters or search terms to find more trades."
            : "Start tracking your trading performance by adding your first trade."
          }
        </p>
        
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/dashboard/add-trade">
              <Plus className="h-4 w-4 mr-2" />
              Add Trade
            </Link>
          </Button>
          
          {hasFilters && (
            <Button variant="outline" asChild>
              <Link href="/dashboard/trades">
                Clear Filters
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
