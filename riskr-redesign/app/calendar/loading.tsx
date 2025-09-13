import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarIcon } from "lucide-react"

export default function CalendarLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header Skeleton */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
            <div>
              <div className="flex items-center mb-2">
                <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 mr-3 text-emerald-400" />
                <Skeleton className="h-8 w-48 bg-slate-800" />
              </div>
              <Skeleton className="h-4 w-80 bg-slate-800" />
            </div>

            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-48 bg-slate-800 rounded-lg" />
            </div>
          </div>

          {/* Navigation Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-8 w-8 bg-slate-800 rounded" />
              <Skeleton className="h-6 w-32 bg-slate-800" />
              <Skeleton className="h-8 w-8 bg-slate-800 rounded" />
            </div>

            <div className="flex items-center space-x-4 sm:space-x-6">
              <Skeleton className="h-4 w-24 bg-slate-800" />
              <Skeleton className="h-4 w-24 bg-slate-800" />
              <Skeleton className="h-4 w-24 bg-slate-800" />
            </div>
          </div>
        </div>

        {/* Calendar Grid Skeleton */}
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="p-4 sm:p-6">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-6 bg-slate-800" />
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square bg-slate-800 rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Legend Skeleton */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4 bg-slate-800 rounded" />
                <Skeleton className="h-4 w-20 bg-slate-800" />
              </div>
            ))}
          </div>

          <Skeleton className="h-3 w-64 bg-slate-800" />
        </div>
      </div>
    </div>
  )
}
