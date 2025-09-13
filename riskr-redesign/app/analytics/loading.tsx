import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <Skeleton className="h-8 w-56 mb-2 bg-slate-800" />
          <Skeleton className="h-4 w-80 bg-slate-800" />
        </div>

        {/* KPI Cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-4 w-20 mb-2 bg-slate-800" />
                    <Skeleton className="h-8 w-16 bg-slate-700" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded bg-slate-800" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-slate-900 border-slate-800">
              <CardHeader>
                <Skeleton className="h-6 w-40 bg-slate-800" />
                <Skeleton className="h-4 w-64 bg-slate-800" />
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-slate-800 rounded-lg animate-pulse relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/20 to-transparent animate-shimmer"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Advanced metrics skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <Skeleton className="h-6 w-36 bg-slate-800" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24 bg-slate-800" />
                  <Skeleton className="h-4 w-16 bg-slate-700" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <Skeleton className="h-6 w-32 bg-slate-800" />
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-slate-800 rounded-lg animate-pulse relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/20 to-transparent animate-shimmer"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <Skeleton className="h-6 w-28 bg-slate-800" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20 bg-slate-800" />
                  <Skeleton className="h-6 w-full bg-slate-800" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
