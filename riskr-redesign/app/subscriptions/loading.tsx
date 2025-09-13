import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function SubscriptionsLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Page Header Skeleton */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-64 mb-2 bg-slate-800" />
              <Skeleton className="h-4 w-96 bg-slate-800" />
            </div>
            <Skeleton className="h-6 w-20 bg-slate-800 hidden sm:block" />
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* Current Plan Skeleton */}
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-4">
              <Skeleton className="h-6 w-32 bg-slate-800" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <Skeleton className="h-8 w-32 bg-slate-800" />
                        <Skeleton className="h-5 w-16 bg-slate-800" />
                      </div>
                      <Skeleton className="h-4 w-48 bg-slate-800" />
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-10 w-16 bg-slate-800 mb-1" />
                      <Skeleton className="h-3 w-20 bg-slate-800" />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Skeleton className="h-10 w-32 bg-slate-800" />
                    <Skeleton className="h-10 w-40 bg-slate-800" />
                  </div>
                </div>
                <div className="lg:border-l lg:border-slate-800/50 lg:pl-6">
                  <Skeleton className="h-4 w-24 mb-3 bg-slate-800" />
                  <Skeleton className="h-6 w-32 mb-1 bg-slate-800" />
                  <Skeleton className="h-3 w-28 bg-slate-800" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Plans Skeleton */}
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-6">
              <Skeleton className="h-6 w-40 mx-auto mb-2 bg-slate-800" />
              <Skeleton className="h-4 w-64 mx-auto bg-slate-800" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-6">
                    <div className="text-center mb-6">
                      <Skeleton className="h-6 w-6 mx-auto mb-2 bg-slate-800" />
                      <Skeleton className="h-6 w-24 mx-auto mb-1 bg-slate-800" />
                      <Skeleton className="h-4 w-full mb-4 bg-slate-800" />
                      <div className="mb-4">
                        <Skeleton className="h-10 w-20 mx-auto bg-slate-800" />
                      </div>
                    </div>
                    <div className="space-y-3 mb-6">
                      {[1, 2, 3, 4, 5].map((j) => (
                        <div key={j} className="flex items-start space-x-3">
                          <Skeleton className="h-4 w-4 mt-0.5 bg-slate-800" />
                          <Skeleton className="h-4 flex-1 bg-slate-800" />
                        </div>
                      ))}
                    </div>
                    <Skeleton className="h-10 w-full bg-slate-800" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* FAQ Skeleton */}
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader className="pb-4">
              <Skeleton className="h-6 w-32 bg-slate-800" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="border-b border-slate-800/50 last:border-b-0 pb-4 last:pb-0">
                    <div className="flex items-center justify-between py-2">
                      <Skeleton className="h-5 w-64 bg-slate-800" />
                      <Skeleton className="h-4 w-4 bg-slate-800" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
