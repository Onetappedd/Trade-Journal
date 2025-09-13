import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2 bg-slate-800" />
          <Skeleton className="h-4 w-96 bg-slate-800" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main content area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Portfolio overview cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="bg-slate-900 border-slate-800">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24 bg-slate-800" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-20 mb-1 bg-slate-700" />
                    <Skeleton className="h-3 w-16 bg-slate-800" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Performance chart skeleton */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <Skeleton className="h-6 w-40 bg-slate-800" />
                <Skeleton className="h-4 w-64 bg-slate-800" />
              </CardHeader>
              <CardContent>
                <div className="h-80 bg-slate-800 rounded-lg animate-pulse relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/20 to-transparent animate-shimmer"></div>
                </div>
              </CardContent>
            </Card>

            {/* Recent trades table skeleton */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <Skeleton className="h-6 w-32 bg-slate-800" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0"
                    >
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-8 w-8 rounded bg-slate-800" />
                        <div>
                          <Skeleton className="h-4 w-16 mb-1 bg-slate-800" />
                          <Skeleton className="h-3 w-12 bg-slate-800" />
                        </div>
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-4 w-20 mb-1 bg-slate-800" />
                        <Skeleton className="h-3 w-16 bg-slate-800" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risk metrics sidebar skeleton */}
          <div className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <Skeleton className="h-6 w-28 bg-slate-800" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24 bg-slate-800" />
                    <Skeleton className="h-6 w-16 bg-slate-700" />
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
          </div>
        </div>
      </div>
    </div>
  )
}
