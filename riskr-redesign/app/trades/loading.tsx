import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function TradesLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2 bg-slate-800" />
          <Skeleton className="h-4 w-96 bg-slate-800" />
        </div>

        {/* Filter controls skeleton */}
        <Card className="bg-slate-900 border-slate-800 mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20 bg-slate-800" />
                  <Skeleton className="h-10 w-full bg-slate-800" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2 bg-slate-800" />
                <Skeleton className="h-6 w-16 bg-slate-700" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trades table skeleton */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-32 bg-slate-800" />
              <Skeleton className="h-8 w-24 bg-slate-800" />
            </div>
          </CardHeader>
          <CardContent>
            {/* Desktop table skeleton */}
            <div className="hidden md:block">
              <div className="space-y-3">
                {/* Table header */}
                <div className="grid grid-cols-8 gap-4 pb-3 border-b border-slate-800">
                  {["Symbol", "Type", "Entry", "Exit", "Quantity", "P&L", "Date", "Status"].map((header, i) => (
                    <Skeleton key={i} className="h-4 w-16 bg-slate-800" />
                  ))}
                </div>
                {/* Table rows */}
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-8 gap-4 py-3 border-b border-slate-800/50 last:border-0 animate-pulse relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/10 to-transparent animate-shimmer"></div>
                    <Skeleton className="h-4 w-12 bg-slate-800" />
                    <Skeleton className="h-4 w-16 bg-slate-800" />
                    <Skeleton className="h-4 w-14 bg-slate-800" />
                    <Skeleton className="h-4 w-14 bg-slate-800" />
                    <Skeleton className="h-4 w-10 bg-slate-800" />
                    <Skeleton className="h-4 w-16 bg-slate-800" />
                    <Skeleton className="h-4 w-20 bg-slate-800" />
                    <Skeleton className="h-6 w-16 rounded-full bg-slate-800" />
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile cards skeleton */}
            <div className="md:hidden space-y-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-slate-800 border-slate-700">
                  <CardContent className="p-4 animate-pulse relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-600/10 to-transparent animate-shimmer"></div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <Skeleton className="h-5 w-16 mb-1 bg-slate-700" />
                        <Skeleton className="h-3 w-12 bg-slate-700" />
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full bg-slate-700" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Skeleton className="h-3 w-12 mb-1 bg-slate-700" />
                        <Skeleton className="h-4 w-16 bg-slate-700" />
                      </div>
                      <div>
                        <Skeleton className="h-3 w-8 mb-1 bg-slate-700" />
                        <Skeleton className="h-4 w-14 bg-slate-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
