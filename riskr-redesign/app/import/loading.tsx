import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ImportLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2 bg-slate-800" />
          <Skeleton className="h-4 w-96 bg-slate-800" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* CSV Upload section skeleton */}
          <div className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <Skeleton className="h-6 w-40 bg-slate-800" />
                <Skeleton className="h-4 w-64 bg-slate-800" />
              </CardHeader>
              <CardContent>
                {/* Upload area skeleton with shimmer */}
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center animate-pulse relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/20 to-transparent animate-shimmer"></div>
                  <Skeleton className="h-12 w-12 rounded mx-auto mb-4 bg-slate-800" />
                  <Skeleton className="h-5 w-48 mx-auto mb-2 bg-slate-800" />
                  <Skeleton className="h-4 w-64 mx-auto mb-4 bg-slate-800" />
                  <Skeleton className="h-10 w-32 mx-auto bg-slate-800" />
                </div>

                {/* Supported formats skeleton */}
                <div className="mt-6">
                  <Skeleton className="h-5 w-36 mb-3 bg-slate-800" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full bg-slate-800" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security notice skeleton */}
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Skeleton className="h-5 w-5 rounded bg-slate-800 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32 bg-slate-800" />
                    <Skeleton className="h-3 w-full bg-slate-800" />
                    <Skeleton className="h-3 w-3/4 bg-slate-800" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Broker connections section skeleton */}
          <div className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <Skeleton className="h-6 w-44 bg-slate-800" />
                <Skeleton className="h-4 w-72 bg-slate-800" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <Card key={i} className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors">
                      <CardContent className="p-4 animate-pulse relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-600/10 to-transparent animate-shimmer"></div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Skeleton className="h-8 w-8 rounded bg-slate-700" />
                            <Skeleton className="h-5 w-20 bg-slate-700" />
                          </div>
                          <Skeleton className="h-5 w-16 rounded-full bg-slate-700" />
                        </div>
                        <Skeleton className="h-3 w-full mb-2 bg-slate-700" />
                        <Skeleton className="h-8 w-full bg-slate-700" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Connection status skeleton */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <Skeleton className="h-6 w-36 bg-slate-800" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-6 w-6 rounded bg-slate-800" />
                      <Skeleton className="h-4 w-24 bg-slate-800" />
                    </div>
                    <Skeleton className="h-4 w-16 bg-slate-800" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
