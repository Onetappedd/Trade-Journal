import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <Skeleton className="h-8 w-32 mb-2 bg-slate-800" />
          <Skeleton className="h-4 w-80 bg-slate-800" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar navigation skeleton */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-900 border-slate-800 sticky top-8">
              <CardContent className="p-4">
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 p-3 rounded-lg animate-pulse">
                      <Skeleton className="h-4 w-4 bg-slate-800" />
                      <Skeleton className="h-4 w-24 bg-slate-800" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main content skeleton */}
          <div className="lg:col-span-3 space-y-8">
            {/* Profile section skeleton */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <Skeleton className="h-6 w-28 bg-slate-800" />
                <Skeleton className="h-4 w-64 bg-slate-800" />
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile picture skeleton */}
                <div className="flex items-center space-x-6">
                  <Skeleton className="h-20 w-20 rounded-full bg-slate-800" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32 bg-slate-800" />
                    <Skeleton className="h-8 w-24 bg-slate-800" />
                  </div>
                </div>

                {/* Form fields skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-20 bg-slate-800" />
                      <Skeleton className="h-10 w-full bg-slate-800" />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-3">
                  <Skeleton className="h-10 w-20 bg-slate-800" />
                  <Skeleton className="h-10 w-24 bg-slate-800" />
                </div>
              </CardContent>
            </Card>

            {/* Security section skeleton */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <Skeleton className="h-6 w-32 bg-slate-800" />
                <Skeleton className="h-4 w-72 bg-slate-800" />
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Password change skeleton */}
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-28 bg-slate-800" />
                      <Skeleton className="h-10 w-full bg-slate-800" />
                    </div>
                  ))}
                </div>

                {/* 2FA section skeleton */}
                <div className="border-t border-slate-800 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Skeleton className="h-5 w-40 mb-2 bg-slate-800" />
                      <Skeleton className="h-4 w-64 bg-slate-800" />
                    </div>
                    <Skeleton className="h-6 w-12 bg-slate-800" />
                  </div>
                </div>

                {/* Active sessions skeleton */}
                <div className="border-t border-slate-800 pt-6">
                  <Skeleton className="h-5 w-32 mb-4 bg-slate-800" />
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 bg-slate-800 rounded-lg animate-pulse relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/10 to-transparent animate-shimmer"></div>
                        <div className="flex items-center space-x-3">
                          <Skeleton className="h-8 w-8 rounded bg-slate-700" />
                          <div>
                            <Skeleton className="h-4 w-32 mb-1 bg-slate-700" />
                            <Skeleton className="h-3 w-24 bg-slate-700" />
                          </div>
                        </div>
                        <Skeleton className="h-8 w-16 bg-slate-700" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data management skeleton */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <Skeleton className="h-6 w-36 bg-slate-800" />
                <Skeleton className="h-4 w-80 bg-slate-800" />
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="p-4 border border-slate-800 rounded-lg">
                      <Skeleton className="h-5 w-32 mb-2 bg-slate-800" />
                      <Skeleton className="h-4 w-full mb-3 bg-slate-800" />
                      <Skeleton className="h-9 w-24 bg-slate-800" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
