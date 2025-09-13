import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"

export default function LeaderboardLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header Skeleton */}
      <div className="border-b border-slate-800/50 bg-slate-950/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Skeleton className="h-12 w-12 rounded-xl bg-slate-800" />
              <Skeleton className="h-10 w-64 bg-slate-800" />
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 text-sm font-medium opacity-50">
                <Sparkles className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            </div>
            <Skeleton className="h-6 w-96 mx-auto bg-slate-800" />
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls Skeleton */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
          <Skeleton className="h-10 w-full sm:w-64 bg-slate-800" />
          <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-40 bg-slate-800" />
            <Skeleton className="h-10 w-10 bg-slate-800" />
          </div>
        </div>

        {/* Top 3 Traders Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className={`bg-slate-900/50 border-slate-800/50 ${i === 1 ? "ring-2 ring-emerald-500/20" : ""}`}
            >
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  <Skeleton className="h-5 w-5 bg-slate-700 mr-2" />
                  <Skeleton className="h-8 w-12 bg-slate-700 rounded-full" />
                </div>

                <div className="mb-4">
                  <Skeleton className="h-20 w-20 rounded-full bg-slate-700 mx-auto mb-3" />
                  <Skeleton className="h-6 w-32 bg-slate-700 mx-auto" />
                </div>

                <div className="space-y-3">
                  <div>
                    <Skeleton className="h-10 w-32 bg-slate-700 mx-auto mb-1" />
                    <Skeleton className="h-4 w-16 bg-slate-700 mx-auto" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Skeleton className="h-6 w-16 bg-slate-700 mx-auto mb-1" />
                      <Skeleton className="h-3 w-8 bg-slate-700 mx-auto" />
                    </div>
                    <div>
                      <Skeleton className="h-6 w-16 bg-slate-700 mx-auto mb-1" />
                      <Skeleton className="h-3 w-12 bg-slate-700 mx-auto" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Full Leaderboard Skeleton */}
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-48 bg-slate-700" />
              <Skeleton className="h-8 w-20 bg-slate-700" />
            </div>
          </CardHeader>
          <CardContent>
            {/* Desktop Table Skeleton */}
            <div className="hidden lg:block">
              <div className="border-b border-slate-800/50 bg-slate-900/50 mb-4">
                <div className="flex items-center py-3 px-4">
                  <Skeleton className="h-4 w-12 bg-slate-700" />
                  <Skeleton className="h-4 w-20 bg-slate-700 ml-8" />
                  <div className="flex-1" />
                  <Skeleton className="h-4 w-16 bg-slate-700 mr-4" />
                  <Skeleton className="h-4 w-12 bg-slate-700 mr-4" />
                  <Skeleton className="h-4 w-16 bg-slate-700 mr-4" />
                  <Skeleton className="h-4 w-12 bg-slate-700" />
                </div>
              </div>

              <div className="space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center py-4 px-4 border-b border-slate-800/30">
                    <div className="flex items-center space-x-2 w-20">
                      <Skeleton className="h-4 w-4 bg-slate-700" />
                      <Skeleton className="h-5 w-8 bg-slate-700 rounded" />
                    </div>
                    <div className="flex items-center space-x-3 flex-1">
                      <Skeleton className="h-8 w-8 rounded-full bg-slate-700" />
                      <Skeleton className="h-4 w-24 bg-slate-700" />
                    </div>
                    <Skeleton className="h-4 w-20 bg-slate-700 mr-4" />
                    <Skeleton className="h-4 w-16 bg-slate-700 mr-4" />
                    <Skeleton className="h-4 w-12 bg-slate-700 mr-4" />
                    <Skeleton className="h-4 w-8 bg-slate-700" />
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Cards Skeleton */}
            <div className="lg:hidden space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="bg-slate-800/30 border-slate-700/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <Skeleton className="h-10 w-16 bg-slate-700 rounded-full" />
                      <Skeleton className="h-14 w-14 rounded-full bg-slate-700" />
                    </div>
                    <Skeleton className="h-7 w-40 bg-slate-700 mb-4" />
                    <div className="grid grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j}>
                          <Skeleton className="h-7 w-20 bg-slate-700 mb-1" />
                          <Skeleton className="h-4 w-16 bg-slate-700" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
